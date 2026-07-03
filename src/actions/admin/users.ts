"use server";

import { db } from "@/lib/db";
import { users, rolePermissions } from "@/lib/db/schema";
import { eq, count, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
    PERMISSIONS,
    getDefaultPermissionMatrix,
    normalizeRole,
    type AppRole,
    type Permission,
} from "@/lib/auth/rbac";
import { LogService } from "@/lib/analytics/audit";
import { OrganizationService } from "@/lib/organizations/organization.service";

export async function requireSuperAdmin() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");
    if (session.user.role !== "super_admin") throw new Error("Forbidden");
    return session.user;
}

export async function requireAdminOrSuper() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");
    if (session.user.role !== "admin" && session.user.role !== "super_admin") throw new Error("Forbidden");
    return session.user;
}

export async function updateUserRole(
    userId: string,
    role: "member" | "organizer" | "admin" | "super_admin"
) {
    const currentUser = await requireAdminOrSuper();
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
        return { success: true };
    }

    if (actorRole !== "super_admin") {
        throw new Error("Forbidden");
    }

    await db.update(users).set({ role }).where(eq(users.id, userId));

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
    return { success: true };
}

export async function getPermissionMatrix() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");

    const currentRole = normalizeRole(session.user.role);
    if (currentRole !== "super_admin") {
        throw new Error("Forbidden");
    }

    const matrix = getDefaultPermissionMatrix();

    const overrides = await db
        .select({
            roleName: rolePermissions.roleName,
            permission: rolePermissions.permission,
            allowed: rolePermissions.allowed,
        })
        .from(rolePermissions);

    for (const row of overrides) {
        const role = normalizeRole(row.roleName);
        const permission = row.permission as Permission;
        if (role !== "super_admin" && PERMISSIONS.includes(permission)) {
            matrix[role][permission] = row.allowed;
        }
    }

    // Super Admin is always full access and not overridable
    for (const permission of PERMISSIONS) {
        matrix.super_admin[permission] = true;
    }

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

    revalidatePath("/admin/permissions");

    return { success: true };
}
