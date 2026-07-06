"use server";

import { db } from "@/lib/db";
import { exportFullDatabaseData } from "@/lib/db/export-full-database";
import {
    roles,
    payments,
    registrations,
    events,
    users,
    transportRoutes,
    transportBookings,
    categories,
    notifications,
    paymentMethods,
    rolePermissions,
} from "@/lib/db/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "./users";
import { logAdminAction } from "@/lib/analytics/log-admin-action";

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
    const user = await requireSuperAdmin();
    await db
        .update(roles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(roles.name, name));

    await logAdminAction({
        actorId: user.id,
        actorName: user.name ?? user.email,
        action: "role.update",
        entityType: "role",
        entityId: name,
        details: `Rol ${name} actualizado: label=${data.label}`,
    });

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

export async function exportFullDatabase() {
    await requireSuperAdmin();
    return exportFullDatabaseData();
}
