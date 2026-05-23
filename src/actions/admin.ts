"use server";

import { db } from "@/lib/db";
import { users, roles, payments, registrations, rolePermissions, categories } from "@/lib/db/schema";
import type { Category } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, count, and, inArray, isNull, asc, sql as sqlExpr } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
    PERMISSIONS,
    ROLE_ORDER,
    getDefaultPermissionMatrix,
    normalizeRole,
    type AppRole,
    type Permission,
} from "@/lib/auth/rbac";

async function requireSuperAdmin() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");
    if (session.user.role !== "super_admin") throw new Error("Forbidden");
    return session.user;
}

export async function updateUserRole(
    userId: string,
    role: "member" | "organizer" | "admin" | "super_admin"
) {
    await requireSuperAdmin();
    await db.update(users).set({ role }).where(eq(users.id, userId));
    revalidatePath("/admin/users");
    return { success: true };
}

// ─── Category CRUD (admin/super_admin) ────────────────────────────────────────

async function requireAdminOrSuper() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");
    if (session.user.role !== "admin" && session.user.role !== "super_admin") throw new Error("Forbidden");
    return session.user;
}

export async function getAllCategories(): Promise<Category[]> {
    await requireAdminOrSuper();
    return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function createCategory(input: {
    slug: string;
    label: string;
    description?: string;
    colorClass?: string;
    sortOrder?: number;
}) {
    const user = await requireAdminOrSuper();
    const slug = input.slug.trim().toLowerCase().replace(/\s+/g, "_");
    if (!/^[a-z0-9_]+$/.test(slug)) throw new Error("Slug can only contain lowercase letters, numbers and underscores");
    const [created] = await db.insert(categories).values({
        slug,
        label: input.label.trim(),
        description: input.description?.trim() ?? null,
        colorClass: input.colorClass ?? "bg-gray-100 text-gray-800",
        sortOrder: input.sortOrder ?? 99,
        createdBy: user.id,
    }).returning();
    revalidatePath("/admin/categories");
    return { success: true, category: created };
}

export async function updateCategory(id: string, input: {
    label?: string;
    description?: string;
    colorClass?: string;
    sortOrder?: number;
    isActive?: boolean;
}) {
    await requireAdminOrSuper();
    await db.update(categories).set({
        ...(input.label !== undefined && { label: input.label.trim() }),
        ...(input.description !== undefined && { description: input.description.trim() }),
        ...(input.colorClass !== undefined && { colorClass: input.colorClass }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        updatedAt: new Date(),
    }).where(eq(categories.id, id));
    revalidatePath("/admin/categories");
    return { success: true };
}

export async function deleteCategory(id: string) {
    await requireAdminOrSuper();
    const [cat] = await db.select({ slug: categories.slug }).from(categories).where(eq(categories.id, id));
    if (!cat) throw new Error("Category not found");
    // Import events table inline to avoid circular — it's in the same schema file
    const { events: eventsTable } = await import("@/lib/db/schema");
    const [{ cnt }] = await db
        .select({ cnt: sqlExpr<number>`count(*)::int` })
        .from(eventsTable)
        .where(eq(eventsTable.category, cat.slug));
    if (cnt > 0) throw new Error(`Cannot delete — ${cnt} event(s) use this category`);
    await db.delete(categories).where(eq(categories.id, id));
    revalidatePath("/admin/categories");
    return { success: true };
}

export async function reorderCategories(orderedIds: string[]) {
    await requireAdminOrSuper();

    if (!orderedIds.length) {
        return { success: true };
    }

    await db.transaction(async (tx) => {
        for (let i = 0; i < orderedIds.length; i += 1) {
            await tx
                .update(categories)
                .set({ sortOrder: i + 1, updatedAt: new Date() })
                .where(eq(categories.id, orderedIds[i]));
        }
    });

    revalidatePath("/admin/categories");
    return { success: true };
}

export async function deleteUser(userId: string) {
    const currentUser = await requireSuperAdmin();

    if (currentUser.id === userId) {
        throw new Error("You cannot delete your own account");
    }

    const [target] = await db
        .select({ role: users.role })
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
    revalidatePath("/admin/users");
    return { success: true };
}

// ─── Roles table ─────────────────────────────────────────────────────────────

const DEFAULT_ROLES = [
    {
        name: "super_admin",
        label: "Super Admin",
        description: "Full platform access: manage users, events and all settings.",
        color: "purple",
    },
    {
        name: "admin",
        label: "Administrador",
        description: "Oversee operations, payments and participant workflows.",
        color: "rose",
    },
    {
        name: "organizer",
        label: "Organizer",
        description: "Create and manage events, view attendees and analytics.",
        color: "blue",
    },
    {
        name: "member",
        label: "Cliente",
        description: "Browse and register for events in the community.",
        color: "green",
    },
] as const;

export async function seedRoles() {
    await requireSuperAdmin();
    for (const role of DEFAULT_ROLES) {
        await db
            .insert(roles)
            .values(role)
            .onConflictDoNothing();
    }
    revalidatePath("/admin/roles");
    return { success: true };
}

export async function updateRole(
    name: string,
    data: { label: string; description: string; color: string }
) {
    await requireSuperAdmin();
    await db
        .update(roles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(roles.name, name));
    revalidatePath("/admin/roles");
    return { success: true };
}

export async function backfillPendingPayments() {
    await requireSuperAdmin();

    const missingPayments = await db
        .select({
            registrationId: registrations.id,
            userId: registrations.userId,
        })
        .from(registrations)
        .leftJoin(
            payments,
            and(
                eq(payments.registrationId, registrations.id),
                eq(payments.userId, registrations.userId)
            )
        )
        .where(
            and(
                inArray(registrations.status, ["registered", "checked_in"]),
                isNull(payments.id)
            )
        );

    if (missingPayments.length > 0) {
        await db.insert(payments).values(
            missingPayments.map((item) => ({
                registrationId: item.registrationId,
                userId: item.userId,
                amount: "1.00",
                currency: "PEN",
                method: "Pendiente de selección",
                status: "pending" as const,
                notes: "Pago pendiente creado por backfill desde panel super admin",
            }))
        );
    }

    revalidatePath("/admin/payments");
    revalidatePath("/member/payments");
    revalidatePath("/organizer/payments");

    return { success: true, inserted: missingPayments.length };
}

export async function getPermissionMatrix() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");

    const currentRole = normalizeRole(session.user.role);
    if (currentRole !== "super_admin" && currentRole !== "admin") {
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
