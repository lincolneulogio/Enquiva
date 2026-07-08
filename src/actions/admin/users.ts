"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, rolePermissions, roles } from "@/lib/db/schema";
import { getFullEffectivePermissionMatrix } from "@/lib/auth/effective-permissions";
import { logAdminAction } from "@/lib/analytics/log-admin-action";
import { eq, count, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
    PERMISSIONS,
    ROLE_LABELS,
    getDefaultPermissionMatrix,
    normalizeRole,
    type AppRole,
    type Permission,
} from "@/lib/auth/rbac";
import { LogService } from "@/lib/analytics/audit";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { assertCanAssignSuperAdmin } from "@/lib/auth/platform-bootstrap";
import {
    requireSuperAdmin,
    requireAdminOrSuper,
} from "@/lib/auth/guards";
import { assertPermission } from "@/lib/auth/permission-guards";
import { broadcastTableRefresh } from "@/lib/pusher/table-refresh";

export { requireSuperAdmin, requireAdminOrSuper };

export async function updateUserRole(
    userId: string,
    role: "member" | "organizer" | "admin" | "super_admin"
) {
    const currentUser = await requireAdminOrSuper();
    await assertPermission(currentUser, "users:manage");
    const actorRole = normalizeRole(currentUser.role);
    const hdrs = await headers();
    const ipAddress = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "unknown";
    const userAgent = hdrs.get("user-agent") ?? "unknown";

    if (actorRole === "admin") {
        if (role !== "organizer" && role !== "member") {
            throw new Error("Solo puedes asignar roles de organizador o asistente dentro de tu entidad.");
        }
        await OrganizationService.promoteUserInOrg({
            actorId: currentUser.id,
            actorRole: currentUser.role,
            targetUserId: userId,
            newRole: role,
        });
        revalidatePath("/admin/users");
        revalidatePath("/admin/team");
        await broadcastTableRefresh({ resource: ["users", "team"], userId });
        return { success: true };
    }

    if (actorRole !== "super_admin") {
        throw new Error("Forbidden");
    }

    if (role === "super_admin") {
        await assertCanAssignSuperAdmin(userId);
    }

    await db.update(users).set({ role }).where(eq(users.id, userId));
    await OrganizationService.syncUserRoleWithOrganizationMembership(userId, role);

    await LogService.log({
        actorId: currentUser.id,
        actorName: currentUser.name ?? currentUser.email,
        action: "user.role_change",
        entityType: "user",
        entityId: userId,
        details: `Rol cambiado a: ${role}`,
        ipAddress,
        userAgent,
    });

    revalidatePath("/admin/users");
    await broadcastTableRefresh({ resource: "users", userId });
    return { success: true };
}

export async function deleteUser(userId: string) {
    const currentUser = await requireSuperAdmin();
    const hdrs = await headers();
    const ipAddress = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "unknown";
    const userAgent = hdrs.get("user-agent") ?? "unknown";

    if (currentUser.id === userId) {
        throw new Error("You cannot delete your own account");
    }

    const [target] = await db
        .select({ role: users.role, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!target) {
        throw new Error("User not found");
    }

    if (target.role === "super_admin") {
        const [{ count: superAdminCount }] = await db
            .select({ count: count() })
            .from(users)
            .where(eq(users.role, "super_admin"));

        if (superAdminCount <= 1) {
            throw new Error("Cannot delete the last super admin");
        }
    }

    await db.delete(users).where(eq(users.id, userId));

    await LogService.log({
        actorId: currentUser.id,
        actorName: currentUser.name ?? currentUser.email,
        action: "user.delete",
        entityType: "user",
        entityId: userId,
        details: `Usuario eliminado: ${target.name ?? ""} (${target.email})`,
        ipAddress,
        userAgent,
    });

    revalidatePath("/admin/users");
    await broadcastTableRefresh({ resource: "users" });
    return { success: true };
}

export async function getPermissionMatrix() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");

    const currentRole = normalizeRole(session.user.role);
    if (currentRole !== "super_admin") {
        throw new Error("Forbidden");
    }

    const matrix = await getFullEffectivePermissionMatrix();
    return matrix;
}

export async function updateRolePermission(input: {
    role: AppRole;
    permission: Permission;
    allowed: boolean;
}) {
    const currentUser = await requireSuperAdmin();

    if (input.role === "super_admin") {
        throw new Error("Super Admin permissions are fixed and cannot be changed");
    }

    const defaults = getDefaultPermissionMatrix();
    const defaultAllowed = defaults[input.role][input.permission];

    if (input.allowed === defaultAllowed) {
        await db
            .delete(rolePermissions)
            .where(
                and(
                    eq(rolePermissions.roleName, input.role),
                    eq(rolePermissions.permission, input.permission)
                )
            );
    } else {
        // Asegura que exista la fila del rol (FK role_permissions.role_name → roles.name),
        // por si la tabla `roles` aún no fue sembrada. Idempotente.
        await db
            .insert(roles)
            .values({
                name: input.role,
                label: ROLE_LABELS[input.role],
                description: ROLE_LABELS[input.role],
            })
            .onConflictDoNothing();

        await db
            .insert(rolePermissions)
            .values({
                roleName: input.role,
                permission: input.permission,
                allowed: input.allowed,
                updatedBy: currentUser.id,
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: [rolePermissions.roleName, rolePermissions.permission],
                set: {
                    allowed: input.allowed,
                    updatedBy: currentUser.id,
                    updatedAt: new Date(),
                },
            });
    }

    await logAdminAction({
        actorId: currentUser.id,
        actorName: currentUser.name ?? currentUser.email,
        action: "permission.update",
        entityType: "permission",
        entityId: `${input.role}:${input.permission}`,
        details: `Permiso ${input.permission} para rol ${input.role}: ${input.allowed ? "habilitado" : "deshabilitado"} (default=${defaultAllowed})`,
    });

    revalidatePath("/admin/permissions");
    revalidatePath("/superadmin/permissions");

    return { success: true };
}

/** Elimina todos los overrides de un rol, restaurando sus permisos por defecto. */
export async function resetRolePermissions(input: { role: AppRole }) {
    const currentUser = await requireSuperAdmin();

    if (input.role === "super_admin") {
        throw new Error("Super Admin permissions are fixed and cannot be changed");
    }

    await db.delete(rolePermissions).where(eq(rolePermissions.roleName, input.role));

    await logAdminAction({
        actorId: currentUser.id,
        actorName: currentUser.name ?? currentUser.email,
        action: "permission.update",
        entityType: "permission",
        entityId: `${input.role}:reset`,
        details: `Permisos del rol ${input.role} restablecidos a los valores por defecto.`,
    });

    revalidatePath("/admin/permissions");
    revalidatePath("/superadmin/permissions");

    return { success: true };
}
