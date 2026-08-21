"use server";

import { revalidatePath } from "next/cache";
import { TransportService } from "@/services/transport/transport.service";
import { bookTransportSchema } from "@/services/booking/booking.service";
import { requirePlanFeature } from "@/lib/billing/enforce";
import {
  createTransportRouteSchema,
  updateTransportRouteSchema,
  type CreateTransportRouteInput,
  type UpdateTransportRouteInput,
} from "@/lib/validations";
import { assertEventInAdminScope, assertRouteInAdminScope } from "@/lib/organizations/admin-scope";
import {
  requireAuth,
  requireOrganizerOrHigher,
} from "@/lib/auth/guards";
import { authorize } from "@/lib/auth/authorize";
import { loadTransportBookingAuthResource } from "@/lib/auth/load-resource";
import { assertAnyPermission } from "@/lib/auth/permission-guards";
import { logAdminAction } from "@/lib/analytics/log-admin-action";
import { z } from "zod";

// ─── Organizer: Gestión de rutas ──────────────────────────────────────────────

export async function getRoutesByEvent(eventId: string) {
    const user = await requireAuth();
    const role = user.role ?? "member";
    if (role === "organizer" || role === "admin" || role === "super_admin") {
        await assertEventInAdminScope(eventId, user.id, user.role);
    }
    return TransportService.getRoutesByEvent(eventId);
}

export async function createRoute(input: CreateTransportRouteInput) {
    const user = await requireOrganizerOrHigher();
    await assertAnyPermission(user, ["transport:manage:org", "transport:manage:own"]);
    await requirePlanFeature(user.id, user.role, "transport");
    const validated = createTransportRouteSchema.parse(input);
    const route = await TransportService.createRoute(validated, user.id, user.role ?? "member");

    await logAdminAction({
        actorId: user.id,
        actorName: user.name ?? user.email,
        action: "transport.route.create",
        entityType: "transport",
        entityId: route.id,
        details: `Ruta creada: ${validated.name} (evento ${validated.eventId})`,
    });

    let transportOfferNotified = 0;
    // Primera ruta usable → ofrecer add-on de transporte a inscritos sin booking
    try {
        const { db } = await import("@/lib/db");
        const { transportRoutes } = await import("@/lib/db/schema");
        const { and, eq, sql } = await import("drizzle-orm");
        const [stats] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(transportRoutes)
            .where(
                and(
                    eq(transportRoutes.eventId, validated.eventId),
                    eq(transportRoutes.isActive, true),
                ),
            );
        if (Number(stats?.count ?? 0) === 1) {
            const { notifyRegistrantsTransportAvailable } = await import(
                "@/lib/notifications/transport-available-offer"
            );
            const result = await notifyRegistrantsTransportAvailable(validated.eventId);
            transportOfferNotified = result.notified;
        }
    } catch (err) {
        console.error("[createRoute] transport offer notify failed", err);
    }

    revalidatePath(`/organizer/events/${validated.eventId}`);
    revalidatePath(`/member/transport`);
    revalidatePath(`/member/tickets`);
    return { success: true, route, transportOfferNotified };
}

export async function updateRoute(
    routeId: string,
    input: UpdateTransportRouteInput
) {
    const user = await requireOrganizerOrHigher();
    await assertAnyPermission(user, ["transport:manage:org", "transport:manage:own"]);
    const validated = updateTransportRouteSchema.parse(input);
    const eventId = await TransportService.updateRoute(routeId, validated, user.id, user.role ?? "member");

    await logAdminAction({
        actorId: user.id,
        actorName: user.name ?? user.email,
        action: "transport.route.update",
        entityType: "transport",
        entityId: routeId,
        details: `Ruta actualizada (evento ${eventId})`,
    });

    revalidatePath(`/organizer/events/${eventId}`);
    return { success: true };
}

export async function deleteRoute(routeId: string) {
    const user = await requireOrganizerOrHigher();
    await assertAnyPermission(user, ["transport:manage:org", "transport:manage:own"]);
    const eventId = await TransportService.deleteRoute(routeId, user.id, user.role ?? "member");

    await logAdminAction({
        actorId: user.id,
        actorName: user.name ?? user.email,
        action: "transport.route.delete",
        entityType: "transport",
        entityId: routeId,
        details: `Ruta eliminada (evento ${eventId})`,
    });

    revalidatePath(`/organizer/events/${eventId}`);
    return { success: true };
}

export async function toggleRouteActive(routeId: string, isActive: boolean) {
    const user = await requireOrganizerOrHigher();
    await assertAnyPermission(user, ["transport:manage:org", "transport:manage:own"]);
    await TransportService.toggleRouteActive(routeId, isActive, user.id, user.role ?? "member");

    if (isActive) {
        try {
            const { db } = await import("@/lib/db");
            const { transportRoutes } = await import("@/lib/db/schema");
            const { eq, and, sql } = await import("drizzle-orm");
            const [routeRow] = await db
                .select({ eventId: transportRoutes.eventId })
                .from(transportRoutes)
                .where(eq(transportRoutes.id, routeId))
                .limit(1);
            if (routeRow?.eventId) {
                const [stats] = await db
                    .select({ count: sql<number>`count(*)::int` })
                    .from(transportRoutes)
                    .where(
                        and(
                            eq(transportRoutes.eventId, routeRow.eventId),
                            eq(transportRoutes.isActive, true),
                        ),
                    );
                if (Number(stats?.count ?? 0) === 1) {
                    const { notifyRegistrantsTransportAvailable } = await import(
                        "@/lib/notifications/transport-available-offer"
                    );
                    const { runBackground } = await import("@/lib/background");
                    runBackground(async () => {
                        await notifyRegistrantsTransportAvailable(routeRow.eventId);
                    });
                }
            }
        } catch (err) {
            console.error("[toggleRouteActive] transport offer notify failed", err);
        }
    }

    return { success: true };
}

export async function toggleEventTransport(eventId: string, hasTransport: boolean) {
    const user = await requireOrganizerOrHigher();
    await assertAnyPermission(user, ["transport:manage:org", "transport:manage:own"]);
    if (hasTransport) {
        await requirePlanFeature(user.id, user.role, "transport");
    }
    await TransportService.toggleEventTransport(eventId, hasTransport, user.id, user.role ?? "member");

    await logAdminAction({
        actorId: user.id,
        actorName: user.name ?? user.email,
        action: "transport.event.toggle",
        entityType: "event",
        entityId: eventId,
        details: `Transporte ${hasTransport ? "habilitado" : "deshabilitado"} para el evento`,
    });

    if (hasTransport) {
        try {
            const { shouldAnnounceTransportOffer, notifyRegistrantsTransportAvailable } =
                await import("@/lib/notifications/transport-available-offer");
            const { runBackground } = await import("@/lib/background");
            if (await shouldAnnounceTransportOffer(eventId)) {
                runBackground(async () => {
                    await notifyRegistrantsTransportAvailable(eventId);
                });
            }
        } catch (err) {
            console.error("[toggleEventTransport] transport offer notify failed", err);
        }
    }

    revalidatePath(`/organizer/transport`);
    revalidatePath(`/organizer/events/${eventId}`);
    revalidatePath(`/admin/transport`);
    revalidatePath(`/member/transport`);
    revalidatePath(`/member/tickets`);
    return { success: true };
}

// ─── Member: Reservar transporte ─────────────────────────────────────────────

export async function getMyTransportBookings() {
    const user = await requireAuth();
    await authorize({ user, permission: "transport:book:own" });
    return TransportService.getMyTransportBookings(user.id);
}

export async function getMemberTransportOptions() {
    const user = await requireAuth();
    await authorize({ user, permission: "transport:book:own" });
    return TransportService.getMemberTransportOptions(user.id);
}

export async function bookTransport(input: z.infer<typeof bookTransportSchema>) {
    const user = await requireAuth();
    await authorize({
      user,
      permission: "transport:book:own",
      resource: { type: "transport", ownerUserId: user.id },
    });
    const { booking, payment } = await TransportService.bookTransport(input, user.id, user.name ?? "Un participante");

    revalidatePath("/member/transport");
    revalidatePath("/member/payments");
    return { success: true, booking, payment };
}

export async function cancelTransportBooking(bookingId: string, password?: string) {
    const user = await requireAuth();
    await authorize({
      user,
      permission: "transport:book:own",
      resource: await loadTransportBookingAuthResource(bookingId),
    });
    await TransportService.cancelTransportBooking(bookingId, user.id, password);

    revalidatePath("/member/transport");
    return { success: true };
}

// ─── Admin: Ver y aprobar pagos de transporte ─────────────────────────────────

export async function getTransportBookingsForEvent(eventId: string) {
    const user = await requireOrganizerOrHigher();
    await assertAnyPermission(user, ["transport:manage:org", "transport:manage:own", "payments:view:org", "payments:view:own"]);
    await assertEventInAdminScope(eventId, user.id, user.role);
    return TransportService.getTransportBookingsForEvent(eventId);
}

export async function approveTransportPayment(paymentId: string) {
    const user = await requireOrganizerOrHigher();
    await assertAnyPermission(user, ["payments:update:org", "payments:update:own"]);
    await TransportService.approveTransportPayment(paymentId, user.id, user.role ?? "member");

    revalidatePath("/admin/payments");
    revalidatePath("/organizer/payments");
    revalidatePath("/organizer/transport");
    return { success: true };
}

export async function rejectTransportPayment(paymentId: string, reason?: string) {
    const user = await requireOrganizerOrHigher();
    await assertAnyPermission(user, ["payments:update:org", "payments:update:own"]);
    await TransportService.rejectTransportPayment(paymentId, user.id, user.role ?? "member", reason);

    revalidatePath("/admin/payments");
    revalidatePath("/organizer/payments");
    revalidatePath("/organizer/transport");
    return { success: true };
}

// ─── Passenger Manifest Query ───────────────────────────────────────────────

import { db } from "@/lib/db";
import { transportBookings, transportRoutes, transportStops, registrations, users, payments, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getEventPassengerManifest(eventId: string) {
    const user = await requireOrganizerOrHigher();

    const [event] = await db
        .select({ id: events.id, organizerId: events.organizerId })
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

    if (!event) throw new Error("Event not found");

    await assertEventInAdminScope(eventId, user.id, user.role);

    const bookings = await db
        .select({
            id: transportBookings.id,
            seats: transportBookings.seats,
            status: transportBookings.status,
            notes: transportBookings.notes,
            passengerName: users.name,
            passengerEmail: users.email,
            passengerPhone: registrations.contactPhone,
            routeId: transportRoutes.id,
            routeName: transportRoutes.name,
            departurePoint: transportRoutes.departurePoint,
            driverName: transportRoutes.driverName,
            vehiclePlate: transportRoutes.vehiclePlate,
            stopName: transportStops.name,
            stopSortOrder: transportStops.sortOrder,
            paymentStatus: payments.status,
        })
        .from(transportBookings)
        .innerJoin(transportRoutes, eq(transportBookings.routeId, transportRoutes.id))
        .innerJoin(users, eq(transportBookings.userId, users.id))
        .innerJoin(registrations, eq(transportBookings.registrationId, registrations.id))
        .leftJoin(transportStops, eq(transportBookings.stopId, transportStops.id))
        .leftJoin(payments, eq(payments.transportBookingId, transportBookings.id))
        .where(eq(transportRoutes.eventId, eventId))
        .orderBy(transportRoutes.name, transportStops.sortOrder, users.name);

    return { success: true, bookings };
}

// ─── Transport Stops Actions ────────────────────────────────────────────────

export async function getStopsByRoute(routeId: string) {
    await requireAuth();
    return db
        .select()
        .from(transportStops)
        .where(eq(transportStops.routeId, routeId))
        .orderBy(transportStops.sortOrder, transportStops.createdAt);
}

export async function createTransportStop(input: {
    routeId: string;
    name: string;
    latitude?: string | null;
    longitude?: string | null;
    sortOrder?: number;
    estimatedArrivalTime?: string | null;
    maxSeats?: number | null;
}) {
    const user = await requireOrganizerOrHigher();
    await assertAnyPermission(user, ["transport:manage:org", "transport:manage:own"]);
    await assertRouteInAdminScope(input.routeId, user.id, user.role);

    if (!input.routeId || !input.name.trim()) {
        throw new Error("Route ID and Stop Name are required");
    }

    if (input.estimatedArrivalTime) {
        const eta = new Date(input.estimatedArrivalTime);
        if (Number.isNaN(eta.getTime())) {
            throw new Error("Hora estimada inválida");
        }
        if (eta.getTime() < Date.now() - 60_000) {
            throw new Error("La hora estimada del paradero no puede ser en el pasado");
        }
    }

    const existing = await db
        .select({ sortOrder: transportStops.sortOrder })
        .from(transportStops)
        .where(eq(transportStops.routeId, input.routeId));
    const nextOrder =
        input.sortOrder ??
        (existing.length > 0
            ? Math.max(...existing.map((s) => s.sortOrder)) + 1
            : 1);

    const [stop] = await db
        .insert(transportStops)
        .values({
            routeId: input.routeId,
            name: input.name.trim(),
            latitude: input.latitude || null,
            longitude: input.longitude || null,
            sortOrder: nextOrder,
            estimatedArrivalTime: input.estimatedArrivalTime
                ? new Date(input.estimatedArrivalTime)
                : null,
            maxSeats: input.maxSeats ?? null,
        })
        .returning();

    await logAdminAction({
        actorId: user.id,
        actorName: user.name ?? user.email,
        action: "transport.stop.create",
        entityType: "transport",
        entityId: stop.id,
        details: `Parada creada: ${input.name} (ruta ${input.routeId})`,
    });

    return { success: true, stop };
}

export async function updateTransportStop(
    stopId: string,
    input: {
        name?: string;
        latitude?: string | null;
        longitude?: string | null;
        sortOrder?: number;
        estimatedArrivalTime?: string | null;
        maxSeats?: number | null;
    },
) {
    const user = await requireOrganizerOrHigher();
    await assertAnyPermission(user, ["transport:manage:org", "transport:manage:own"]);

    const [existing] = await db
        .select({ routeId: transportStops.routeId })
        .from(transportStops)
        .where(eq(transportStops.id, stopId))
        .limit(1);
    if (!existing) throw new Error("Parada no encontrada");
    await assertRouteInAdminScope(existing.routeId, user.id, user.role);

    if (input.estimatedArrivalTime) {
        const eta = new Date(input.estimatedArrivalTime);
        if (Number.isNaN(eta.getTime())) {
            throw new Error("Hora estimada inválida");
        }
        if (eta.getTime() < Date.now() - 60_000) {
            throw new Error("La hora estimada del paradero no puede ser en el pasado");
        }
    }

    const [stop] = await db
        .update(transportStops)
        .set({
            ...(input.name !== undefined && { name: input.name.trim() }),
            ...(input.latitude !== undefined && { latitude: input.latitude }),
            ...(input.longitude !== undefined && { longitude: input.longitude }),
            ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
            ...(input.estimatedArrivalTime !== undefined && {
                estimatedArrivalTime: input.estimatedArrivalTime
                    ? new Date(input.estimatedArrivalTime)
                    : null,
            }),
            ...(input.maxSeats !== undefined && { maxSeats: input.maxSeats }),
        })
        .where(eq(transportStops.id, stopId))
        .returning();

    return { success: true, stop };
}

export async function deleteTransportStop(stopId: string) {
    const user = await requireOrganizerOrHigher();
    await assertAnyPermission(user, ["transport:manage:org", "transport:manage:own"]);

    const [stop] = await db
        .select({ routeId: transportStops.routeId })
        .from(transportStops)
        .where(eq(transportStops.id, stopId))
        .limit(1);

    if (!stop) throw new Error("Parada no encontrada");
    await assertRouteInAdminScope(stop.routeId, user.id, user.role);

    await db
        .delete(transportStops)
        .where(eq(transportStops.id, stopId));

    await logAdminAction({
        actorId: user.id,
        actorName: user.name ?? user.email,
        action: "transport.stop.delete",
        entityType: "transport",
        entityId: stopId,
        details: `Parada eliminada (ruta ${stop.routeId})`,
    });

    return { success: true };
}
