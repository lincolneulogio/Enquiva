"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { TransportService } from "@/services/transport/transport.service";
import { z } from "zod";

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

async function requireAuth() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");
    return session.user;
}

async function requireOrganizerOrHigher() {
    const user = await requireAuth();
    if (!["organizer", "admin", "super_admin"].includes(user.role ?? "member"))
        throw new Error("Forbidden");
    return user;
}

async function requireAdminOrHigher() {
    const user = await requireAuth();
    if (!["admin", "super_admin"].includes(user.role ?? "member"))
        throw new Error("Forbidden");
    return user;
}

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

const bookTransportSchema = z.object({
    routeId: z.string().uuid(),
    registrationId: z.string().uuid(),
    seats: z.number().int().min(1).max(10),
    notes: z.string().optional(),
    receiptUrl: z.string().url().optional(),
    receiptFileName: z.string().optional(),
    method: z.string().min(1),
    reference: z.string().optional(),
    stopId: z.string().uuid().optional().nullable(),
});

// ─── Organizer: Gestión de rutas ──────────────────────────────────────────────

export async function getRoutesByEvent(eventId: string) {
    await requireAuth();
    return TransportService.getRoutesByEvent(eventId);
}

export async function createRoute(input: z.infer<typeof createRouteSchema>) {
    const user = await requireOrganizerOrHigher();
    const route = await TransportService.createRoute(input, user.id, user.role ?? "member");

    revalidatePath(`/organizer/events/${input.eventId}`);
    return { success: true, route };
}

export async function updateRoute(
    routeId: string,
    input: Partial<z.infer<typeof createRouteSchema>>
) {
    const user = await requireOrganizerOrHigher();
    const eventId = await TransportService.updateRoute(routeId, input, user.id, user.role ?? "member");

    revalidatePath(`/organizer/events/${eventId}`);
    return { success: true };
}

export async function deleteRoute(routeId: string) {
    const user = await requireOrganizerOrHigher();
    const eventId = await TransportService.deleteRoute(routeId, user.id, user.role ?? "member");

    revalidatePath(`/organizer/events/${eventId}`);
    return { success: true };
}

export async function toggleRouteActive(routeId: string, isActive: boolean) {
    await requireOrganizerOrHigher();
    await TransportService.toggleRouteActive(routeId, isActive);
    return { success: true };
}

export async function toggleEventTransport(eventId: string, hasTransport: boolean) {
    const user = await requireOrganizerOrHigher();
    await TransportService.toggleEventTransport(eventId, hasTransport, user.id, user.role ?? "member");

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
    const user = await requireAdminOrHigher();
    await TransportService.approveTransportPayment(paymentId, user.id);

    revalidatePath("/admin/payments");
    revalidatePath("/organizer/transport");
    return { success: true };
}

export async function rejectTransportPayment(paymentId: string, reason?: string) {
    const user = await requireAdminOrHigher();
    await TransportService.rejectTransportPayment(paymentId, user.id, reason);

    revalidatePath("/admin/payments");
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

    if (user.role === "organizer" && event.organizerId !== user.id) {
        throw new Error("Unauthorized access to this event manifest");
    }

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
    await requireOrganizerOrHigher();

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

    return { success: true, stop };
}

export async function deleteTransportStop(stopId: string) {
    await requireOrganizerOrHigher();

    await db
        .delete(transportStops)
        .where(eq(transportStops.id, stopId));

    return { success: true };
}
