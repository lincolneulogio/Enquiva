"use server";

import { db } from "@/lib/db";
import {
    transportRoutes,
    transportBookings,
    payments,
    registrations,
    events,
    notifications,
    users,
} from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

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
    name: z.string().min(3, "Nombre mínimo 3 caracteres"),
    departurePoint: z.string().min(3, "Punto de salida requerido"),
    departureTime: z.string().min(1, "Hora de salida requerida"),
    returnTime: z.string().optional().nullable(),
    pricePerSeat: z.number().nonnegative("El precio no puede ser negativo"),
    totalSeats: z.number().int().positive("Debe haber al menos 1 asiento"),
    description: z.string().optional().nullable(),
});

const bookTransportSchema = z.object({
    routeId: z.string().uuid(),
    registrationId: z.string().uuid(),
    seats: z.number().int().min(1).max(10),
    notes: z.string().optional(),
    receiptUrl: z.string().url().optional(),
    receiptFileName: z.string().optional(),
    method: z.string().min(1, "Método de pago requerido"),
    reference: z.string().optional(),
});

// ─── Organizer: Gestión de rutas ──────────────────────────────────────────────

export async function getRoutesByEvent(eventId: string) {
    const user = await requireAuth();

    const routes = await db
        .select({
            id: transportRoutes.id,
            eventId: transportRoutes.eventId,
            name: transportRoutes.name,
            departurePoint: transportRoutes.departurePoint,
            departureTime: transportRoutes.departureTime,
            returnTime: transportRoutes.returnTime,
            pricePerSeat: transportRoutes.pricePerSeat,
            totalSeats: transportRoutes.totalSeats,
            description: transportRoutes.description,
            isActive: transportRoutes.isActive,
            bookedSeats: sql<number>`(
        SELECT COALESCE(SUM(tb.seats), 0)
        FROM transport_bookings tb
        WHERE tb.route_id = ${transportRoutes.id}
          AND tb.status != 'cancelled'
      )`.as("booked_seats"),
        })
        .from(transportRoutes)
        .where(eq(transportRoutes.eventId, eventId))
        .orderBy(transportRoutes.departureTime);

    return routes;
}

export async function createRoute(input: z.infer<typeof createRouteSchema>) {
    const user = await requireOrganizerOrHigher();
    const data = createRouteSchema.parse(input);

    // Verify event belongs to this organizer (or admin)
    const [event] = await db
        .select({ id: events.id, organizerId: events.organizerId })
        .from(events)
        .where(eq(events.id, data.eventId))
        .limit(1);

    if (!event) throw new Error("Evento no encontrado");
    if (
        !["admin", "super_admin"].includes(user.role ?? "") &&
        event.organizerId !== user.id
    )
        throw new Error("No tienes permiso para gestionar este evento");

    const [route] = await db
        .insert(transportRoutes)
        .values({
            eventId: data.eventId,
            name: data.name,
            departurePoint: data.departurePoint,
            departureTime: new Date(data.departureTime),
            returnTime: data.returnTime ? new Date(data.returnTime) : null,
            pricePerSeat: data.pricePerSeat.toString(),
            totalSeats: data.totalSeats,
            description: data.description ?? null,
        })
        .returning();

    revalidatePath(`/organizer/events/${data.eventId}`);
    return { success: true, route };
}

export async function updateRoute(
    routeId: string,
    input: Partial<z.infer<typeof createRouteSchema>>
) {
    const user = await requireOrganizerOrHigher();

    const [existing] = await db
        .select({ id: transportRoutes.id, eventId: transportRoutes.eventId })
        .from(transportRoutes)
        .where(eq(transportRoutes.id, routeId))
        .limit(1);

    if (!existing) throw new Error("Ruta no encontrada");

    const [event] = await db
        .select({ organizerId: events.organizerId })
        .from(events)
        .where(eq(events.id, existing.eventId))
        .limit(1);

    if (
        !["admin", "super_admin"].includes(user.role ?? "") &&
        event?.organizerId !== user.id
    )
        throw new Error("Forbidden");

    await db
        .update(transportRoutes)
        .set({
            ...(input.name && { name: input.name }),
            ...(input.departurePoint && { departurePoint: input.departurePoint }),
            ...(input.departureTime && { departureTime: new Date(input.departureTime) }),
            ...(input.returnTime !== undefined && {
                returnTime: input.returnTime ? new Date(input.returnTime) : null,
            }),
            ...(input.pricePerSeat !== undefined && {
                pricePerSeat: input.pricePerSeat.toString(),
            }),
            ...(input.totalSeats !== undefined && { totalSeats: input.totalSeats }),
            ...(input.description !== undefined && { description: input.description ?? null }),
            updatedAt: new Date(),
        })
        .where(eq(transportRoutes.id, routeId));

    revalidatePath(`/organizer/events/${existing.eventId}`);
    return { success: true };
}

export async function deleteRoute(routeId: string) {
    const user = await requireOrganizerOrHigher();

    const [existing] = await db
        .select({ id: transportRoutes.id, eventId: transportRoutes.eventId })
        .from(transportRoutes)
        .where(eq(transportRoutes.id, routeId))
        .limit(1);

    if (!existing) throw new Error("Ruta no encontrada");

    // Check no confirmed bookings
    const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(transportBookings)
        .where(
            and(
                eq(transportBookings.routeId, routeId),
                eq(transportBookings.status, "confirmed")
            )
        );

    if (Number(count) > 0)
        throw new Error("No se puede eliminar una ruta con reservas confirmadas");

    await db.delete(transportRoutes).where(eq(transportRoutes.id, routeId));

    revalidatePath(`/organizer/events/${existing.eventId}`);
    return { success: true };
}

export async function toggleRouteActive(routeId: string, isActive: boolean) {
    await requireOrganizerOrHigher();
    await db
        .update(transportRoutes)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(transportRoutes.id, routeId));
    return { success: true };
}

// ─── Member: Reservar transporte ─────────────────────────────────────────────

export async function getMyTransportBookings() {
    const user = await requireAuth();

    const bookings = await db
        .select({
            id: transportBookings.id,
            seats: transportBookings.seats,
            status: transportBookings.status,
            notes: transportBookings.notes,
            bookedAt: transportBookings.bookedAt,
            routeName: transportRoutes.name,
            departurePoint: transportRoutes.departurePoint,
            departureTime: transportRoutes.departureTime,
            returnTime: transportRoutes.returnTime,
            pricePerSeat: transportRoutes.pricePerSeat,
            eventId: transportRoutes.eventId,
            paymentStatus: payments.status,
            paymentAmount: payments.amount,
        })
        .from(transportBookings)
        .innerJoin(transportRoutes, eq(transportBookings.routeId, transportRoutes.id))
        .leftJoin(
            payments,
            eq(payments.transportBookingId, transportBookings.id)
        )
        .where(eq(transportBookings.userId, user.id))
        .orderBy(desc(transportBookings.bookedAt));

    return bookings;
}

export async function getMemberTransportOptions() {
    const user = await requireAuth();

    const myRegistrations = await db
        .select({
            registrationId: registrations.id,
            eventId: events.id,
            eventTitle: events.title,
            eventDate: events.date,
            eventSlug: events.slug,
            hasTransport: events.hasTransport,
            registrationStatus: registrations.status,
        })
        .from(registrations)
        .innerJoin(events, eq(registrations.eventId, events.id))
        .where(
            and(
                eq(registrations.userId, user.id),
                eq(registrations.status, "registered")
            )
        )
        .orderBy(desc(events.date));

    if (myRegistrations.length === 0) return [];

    const registrationsByEvent = new Map(
        myRegistrations.map((r) => [r.eventId, r.registrationId])
    );

    const eventIds = [...registrationsByEvent.keys()];
    const routes = await db
        .select({
            id: transportRoutes.id,
            eventId: transportRoutes.eventId,
            name: transportRoutes.name,
            departurePoint: transportRoutes.departurePoint,
            departureTime: transportRoutes.departureTime,
            returnTime: transportRoutes.returnTime,
            pricePerSeat: transportRoutes.pricePerSeat,
            totalSeats: transportRoutes.totalSeats,
            description: transportRoutes.description,
            isActive: transportRoutes.isActive,
            bookedSeats: sql<number>`(
        SELECT COALESCE(SUM(tb.seats), 0)
        FROM transport_bookings tb
        WHERE tb.route_id = ${transportRoutes.id}
          AND tb.status != 'cancelled'
      )`.as("booked_seats"),
        })
        .from(transportRoutes)
        .where(inArray(transportRoutes.eventId, eventIds))
        .orderBy(transportRoutes.departureTime);

    const existingBookings = await db
        .select({ routeId: transportBookings.routeId, registrationId: transportBookings.registrationId })
        .from(transportBookings)
        .where(eq(transportBookings.userId, user.id));

    const bookedSet = new Set(
        existingBookings.map((b) => `${b.registrationId}:${b.routeId}`)
    );

    return myRegistrations.map((reg) => {
        const routeList = routes
            .filter((r) => r.eventId === reg.eventId && r.isActive)
            .map((r) => {
                const availableSeats = Math.max(0, r.totalSeats - Number(r.bookedSeats));
                const key = `${reg.registrationId}:${r.id}`;

                return {
                    ...r,
                    availableSeats,
                    alreadyBooked: bookedSet.has(key),
                    registrationId: reg.registrationId,
                };
            });

        return {
            ...reg,
            routes: routeList,
        };
    });
}

export async function bookTransport(input: z.infer<typeof bookTransportSchema>) {
    const user = await requireAuth();
    const data = bookTransportSchema.parse(input);

    // Verify this registration belongs to the user
    const [registration] = await db
        .select()
        .from(registrations)
        .where(
            and(
                eq(registrations.id, data.registrationId),
                eq(registrations.userId, user.id)
            )
        )
        .limit(1);

    if (!registration) throw new Error("Registro no encontrado o no te pertenece");

    // Get route and check availability
    const [route] = await db
        .select()
        .from(transportRoutes)
        .where(and(eq(transportRoutes.id, data.routeId), eq(transportRoutes.isActive, true)))
        .limit(1);

    if (!route) throw new Error("Ruta no disponible");

    // Check seats availability
    const [{ bookedCount }] = await db
        .select({
            bookedCount: sql<number>`COALESCE(SUM(seats), 0)`,
        })
        .from(transportBookings)
        .where(
            and(
                eq(transportBookings.routeId, data.routeId),
                eq(transportBookings.status, "pending")
            )
        );

    const available = route.totalSeats - Number(bookedCount);
    if (data.seats > available)
        throw new Error(`Solo quedan ${available} asientos disponibles`);

    // Check if user already has a booking for this route via this registration
    const [existingBooking] = await db
        .select({ id: transportBookings.id })
        .from(transportBookings)
        .where(
            and(
                eq(transportBookings.registrationId, data.registrationId),
                eq(transportBookings.routeId, data.routeId)
            )
        )
        .limit(1);

    if (existingBooking) throw new Error("Ya tienes una reserva para esta ruta");

    // Create booking
    const totalAmount = (Number(route.pricePerSeat) * data.seats).toFixed(2);

    const [booking] = await db
        .insert(transportBookings)
        .values({
            routeId: data.routeId,
            registrationId: data.registrationId,
            userId: user.id,
            seats: data.seats,
            status: "pending",
            notes: data.notes ?? null,
        })
        .returning();

    // Create the transport payment
    const [payment] = await db
        .insert(payments)
        .values({
            registrationId: data.registrationId,
            transportBookingId: booking.id,
            userId: user.id,
            amount: totalAmount,
            currency: "PEN",
            method: data.method,
            reference: data.reference ?? null,
            receiptUrl: data.receiptUrl ?? null,
            receiptFileName: data.receiptFileName ?? null,
            status: "pending",
            notes: `Reserva de transporte: ${route.name} (${data.seats} asiento${data.seats > 1 ? "s" : ""})`,
        })
        .returning();

    // Get the event info for notification
    const [event] = await db
        .select({ title: events.title, organizerId: events.organizerId, id: events.id })
        .from(events)
        .where(eq(events.id, route.eventId))
        .limit(1);

    if (event) {
        await db.insert(notifications).values({
            userId: event.organizerId,
            type: "payment_submitted",
            title: "Nueva reserva de transporte",
            message: `${user.name ?? "Un participante"} reservó ${data.seats} asiento${data.seats > 1 ? "s" : ""} en "${route.name}" para "${event.title}"`,
            metadata: {
                bookingId: booking.id,
                paymentId: payment.id,
                eventId: event.id,
                routeName: route.name,
            },
        });
    }

    revalidatePath("/member/transport");
    revalidatePath("/member/payments");
    return { success: true, booking, payment };
}

export async function cancelTransportBooking(bookingId: string) {
    const user = await requireAuth();

    const [booking] = await db
        .select()
        .from(transportBookings)
        .where(
            and(
                eq(transportBookings.id, bookingId),
                eq(transportBookings.userId, user.id)
            )
        )
        .limit(1);

    if (!booking) throw new Error("Reserva no encontrada");
    if (booking.status === "confirmed")
        throw new Error("No puedes cancelar una reserva ya confirmada. Contacta al organizador.");

    await db
        .update(transportBookings)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(transportBookings.id, bookingId));

    // Cancel associated pending payment
    await db
        .update(payments)
        .set({ status: "rejected", updatedAt: new Date(), notes: "Reserva cancelada por el usuario" })
        .where(
            and(
                eq(payments.transportBookingId, bookingId),
                eq(payments.status, "pending")
            )
        );

    revalidatePath("/member/transport");
    return { success: true };
}

// ─── Admin: Ver y aprobar pagos de transporte ─────────────────────────────────

export async function getTransportBookingsForEvent(eventId: string) {
    await requireOrganizerOrHigher();

    const bookings = await db
        .select({
            id: transportBookings.id,
            seats: transportBookings.seats,
            status: transportBookings.status,
            bookedAt: transportBookings.bookedAt,
            notes: transportBookings.notes,
            userName: users.name,
            userEmail: users.email,
            routeName: transportRoutes.name,
            departurePoint: transportRoutes.departurePoint,
            departureTime: transportRoutes.departureTime,
            pricePerSeat: transportRoutes.pricePerSeat,
            paymentId: payments.id,
            paymentStatus: payments.status,
            paymentAmount: payments.amount,
            paymentMethod: payments.method,
            paymentReference: payments.reference,
            receiptUrl: payments.receiptUrl,
        })
        .from(transportBookings)
        .innerJoin(transportRoutes, eq(transportBookings.routeId, transportRoutes.id))
        .innerJoin(users, eq(transportBookings.userId, users.id))
        .leftJoin(payments, eq(payments.transportBookingId, transportBookings.id))
        .where(eq(transportRoutes.eventId, eventId))
        .orderBy(desc(transportBookings.bookedAt));

    return bookings;
}

export async function approveTransportPayment(paymentId: string) {
    const user = await requireAdminOrHigher();

    const [payment] = await db
        .select({ id: payments.id, transportBookingId: payments.transportBookingId })
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

    if (!payment || !payment.transportBookingId)
        throw new Error("Pago de transporte no encontrado");

    await db
        .update(payments)
        .set({
            status: "approved",
            verifiedBy: user.id,
            verifiedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentId));

    await db
        .update(transportBookings)
        .set({ status: "confirmed", updatedAt: new Date() })
        .where(eq(transportBookings.id, payment.transportBookingId));

    // Notify user
    const [booking] = await db
        .select({ userId: transportBookings.userId, routeId: transportBookings.routeId })
        .from(transportBookings)
        .where(eq(transportBookings.id, payment.transportBookingId))
        .limit(1);

    if (booking) {
        const [route] = await db
            .select({ name: transportRoutes.name })
            .from(transportRoutes)
            .where(eq(transportRoutes.id, booking.routeId))
            .limit(1);

        await db.insert(notifications).values({
            userId: booking.userId,
            type: "payment_status_updated",
            title: "¡Reserva de transporte confirmada!",
            message: `Tu reserva para "${route?.name ?? "la ruta"}" fue aprobada. Nos vemos en el punto de salida.`,
            metadata: { paymentId, bookingId: payment.transportBookingId },
        });
    }

    revalidatePath("/admin/payments");
    revalidatePath("/organizer/transport");
    return { success: true };
}

export async function rejectTransportPayment(paymentId: string, reason?: string) {
    const user = await requireAdminOrHigher();

    const [payment] = await db
        .select({ id: payments.id, transportBookingId: payments.transportBookingId })
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

    if (!payment || !payment.transportBookingId)
        throw new Error("Pago de transporte no encontrado");

    await db
        .update(payments)
        .set({
            status: "rejected",
            verifiedBy: user.id,
            verifiedAt: new Date(),
            updatedAt: new Date(),
            notes: reason ?? "Rechazado por el administrador",
        })
        .where(eq(payments.id, paymentId));

    await db
        .update(transportBookings)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(transportBookings.id, payment.transportBookingId));

    const [booking] = await db
        .select({ userId: transportBookings.userId })
        .from(transportBookings)
        .where(eq(transportBookings.id, payment.transportBookingId))
        .limit(1);

    if (booking) {
        await db.insert(notifications).values({
            userId: booking.userId,
            type: "payment_status_updated",
            title: "Reserva de transporte rechazada",
            message: reason ?? "Tu reserva de transporte fue rechazada. Contacta al organizador.",
            metadata: { paymentId, bookingId: payment.transportBookingId },
        });
    }

    revalidatePath("/admin/payments");
    revalidatePath("/organizer/transport");
    return { success: true };
}
