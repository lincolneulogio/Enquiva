"use server";

import { revalidatePath } from "next/cache";
import { TransportService } from "@/services/transport/transport.service";
import { bookTransportSchema } from "@/services/booking/booking.service";
import { requirePlanFeature } from "@/lib/billing/enforce";
import { z } from "zod";
import { assertEventInAdminScope, assertRouteInAdminScope } from "@/lib/organizations/admin-scope";
import {
  requireAuth,
  requireOrganizerOrHigher,
} from "@/lib/auth/guards";
import { assertAnyPermission } from "@/lib/auth/permission-guards";
import { logAdminAction } from "@/lib/analytics/log-admin-action";

// ─── Validators ───────────────────────────────────────────────────────────────

const createRouteSchema = z.object({
    eventId: z.string().uuid(),
    name: z.string().min(3),
    departurePoint: z.string().min(3),
    departureTime: z.string().min(1),
    returnTime: z.string().optional().nullable(),
    pricePerSeat: z.number().nonnegative(),
    totalSeats: z.number().int().positive(),
    description: z.string().optional().nullable(),
});

// ─── Organizer: Gestión de rutas ──────────────────────────────────────────────

export async function getRoutesByEvent(eventId: string) {
    const user = await requireAuth();
    const role = user.role ?? "member";
    if (role === "organizer" || role === "admin" || role === "super_admin") {
        await assertEventInAdminScope(eventId, user.id, user.role);
    }
    return TransportService.getRoutesByEvent(eventId);
}

export async function createRoute(input: z.infer<typeof createRouteSchema>) {
    const user = await requireOrganizerOrHigher();
    await requirePlanFeature(user.id, user.role, "transport");
    const route = await TransportService.createRoute(input, user.id, user.role ?? "member");

    await logAdminAction({
        actorId: user.id,
        actorName: user.name ?? user.email,
        action: "transport.route.create",
        entityType: "transport",
        entityId: route.id,
        details: `Ruta creada: ${input.name} (evento ${input.eventId})`,
    });

    revalidatePath(`/organizer/events/${input.eventId}`);
    return { success: true, route };
}

export async function updateRoute(
    routeId: string,
    input: Partial<z.infer<typeof createRouteSchema>>
) {
    const user = await requireOrganizerOrHigher();
    const eventId = await TransportService.updateRoute(routeId, input, user.id, user.role ?? "member");

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
    await TransportService.toggleRouteActive(routeId, isActive, user.id, user.role ?? "member");
    return { success: true };
}

export async function toggleEventTransport(eventId: string, hasTransport: boolean) {
    const user = await requireOrganizerOrHigher();
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

    revalidatePath(`/organizer/transport`);
    revalidatePath(`/organizer/events/${eventId}`);
    revalidatePath(`/admin/transport`);
    return { success: true };
}

// ─── Member: Reservar transporte ─────────────────────────────────────────────

export async function getMyTransportBookings() {
    const user = await requireAuth();
    return TransportService.getMyTransportBookings(user.id);
}

export async function getMemberTransportOptions() {
    const user = await requireAuth();
    return TransportService.getMemberTransportOptions(user.id);
}

export async function bookTransport(input: z.infer<typeof bookTransportSchema>) {
    const user = await requireAuth();
    const { booking, payment } = await TransportService.bookTransport(input, user.id, user.name ?? "Un participante");

    revalidatePath("/member/transport");
    revalidatePath("/member/payments");
    return { success: true, booking, payment };
}

export async function cancelTransportBooking(bookingId: string, password?: string) {
    const user = await requireAuth();
    await TransportService.cancelTransportBooking(bookingId, user.id, password);

    revalidatePath("/member/transport");
    return { success: true };
}

// ─── Admin: Ver y aprobar pagos de transporte ─────────────────────────────────

export async function getTransportBookingsForEvent(eventId: string) {
    await requireOrganizerOrHigher();
    return TransportService.getTransportBookingsForEvent(eventId);
}

export async function approveTransportPayment(paymentId: string) {
    const user = await requireOrganizerOrHigher();
    await assertAnyPermission(user, ["payments:update:any", "payments:update:own"]);
    await TransportService.approveTransportPayment(paymentId, user.id, user.role ?? "member");

    revalidatePath("/admin/payments");
    revalidatePath("/organizer/payments");
    revalidatePath("/organizer/transport");
    return { success: true };
}

export async function rejectTransportPayment(paymentId: string, reason?: string) {
    const user = await requireOrganizerOrHigher();
    await assertAnyPermission(user, ["payments:update:any", "payments:update:own"]);
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
            routeName: transportRoutes.name,
            departurePoint: transportRoutes.departurePoint,
            stopName: transportStops.name,
            paymentStatus: payments.status,
        })
        .from(transportBookings)
        .innerJoin(transportRoutes, eq(transportBookings.routeId, transportRoutes.id))
        .innerJoin(users, eq(transportBookings.userId, users.id))
        .innerJoin(registrations, eq(transportBookings.registrationId, registrations.id))
        .leftJoin(transportStops, eq(transportBookings.stopId, transportStops.id))
        .leftJoin(payments, eq(payments.transportBookingId, transportBookings.id))
        .where(eq(transportRoutes.eventId, eventId))
        .orderBy(transportRoutes.name, users.name);

    return { success: true, bookings };
}

// ─── Transport Stops Actions ────────────────────────────────────────────────

export async function getStopsByRoute(routeId: string) {
    await requireAuth();
    return db
        .select()
        .from(transportStops)
        .where(eq(transportStops.routeId, routeId));
}

export async function createTransportStop(input: {
    routeId: string;
    name: string;
    latitude?: string | null;
    longitude?: string | null;
}) {
    const user = await requireOrganizerOrHigher();
    await assertRouteInAdminScope(input.routeId, user.id, user.role);

    if (!input.routeId || !input.name.trim()) {
        throw new Error("Route ID and Stop Name are required");
    }

    const [stop] = await db
        .insert(transportStops)
        .values({
            routeId: input.routeId,
            name: input.name,
            latitude: input.latitude || null,
            longitude: input.longitude || null,
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

export async function deleteTransportStop(stopId: string) {
    const user = await requireOrganizerOrHigher();

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
