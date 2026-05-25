"use server";

import { db } from "@/lib/db";
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

export async function exportFullDatabase() {
    await requireSuperAdmin();

    const [
        allUsers,
        allEvents,
        allRegistrations,
        allPayments,
        allRoutes,
        allBookings,
        allCategories,
        allNotifications,
        allPaymentMethods,
        allPermissions,
        allRoles,
    ] = await Promise.all([
        db.select().from(users),
        db.select().from(events),
        db.select().from(registrations),
        db.select().from(payments),
        db.select().from(transportRoutes),
        db.select().from(transportBookings),
        db.select().from(categories),
        db.select().from(notifications),
        db.select().from(paymentMethods),
        db.select().from(rolePermissions),
        db.select().from(roles),
    ]);

    return {
        timestamp: new Date().toISOString(),
        version: "1.0",
        data: {
            users: allUsers,
            events: allEvents,
            registrations: allRegistrations,
            payments: allPayments,
            transportRoutes: allRoutes,
            transportBookings: allBookings,
            categories: allCategories,
            notifications: allNotifications,
            paymentMethods: allPaymentMethods,
            rolePermissions: allPermissions,
            roles: allRoles,
        }
    };
}
