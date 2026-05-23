import { db } from "@/lib/db";
import {
    transportRoutes,
    transportBookings,
    payments,
    registrations,
    events,
    notifications,
    accounts,
} from "@/lib/db/schema";
import { verifyPassword } from "better-auth/crypto";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { z } from "zod";

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
});

export class TransportService {
  /**
   * Obtiene las rutas asignadas a un evento con conteo de asientos vendidos.
   */
  static async getRoutesByEvent(eventId: string) {
    return db
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
  }

  /**
   * Crea una nueva ruta de transporte para un evento.
   */
  static async createRoute(input: z.infer<typeof createRouteSchema>, userId: string, userRole: string) {
    const data = createRouteSchema.parse(input);

    const [event] = await db
        .select({ id: events.id, organizerId: events.organizerId })
        .from(events)
        .where(eq(events.id, data.eventId))
        .limit(1);

    if (!event) throw new Error("Evento no encontrado");
    if (
        !["admin", "super_admin"].includes(userRole) &&
        event.organizerId !== userId
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

    return route;
  }

  /**
   * Actualiza una ruta de transporte.
   */
  static async updateRoute(
    routeId: string,
    input: Partial<z.infer<typeof createRouteSchema>>,
    userId: string,
    userRole: string
  ) {
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
        !["admin", "super_admin"].includes(userRole) &&
        event?.organizerId !== userId
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

    return existing.eventId;
  }

  /**
   * Elimina una ruta de transporte (si no tiene reservas confirmadas).
   */
  static async deleteRoute(routeId: string, userId: string, userRole: string) {
    const [existing] = await db
        .select({ id: transportRoutes.id, eventId: transportRoutes.eventId })
        .from(transportRoutes)
        .where(eq(transportRoutes.id, routeId))
        .limit(1);

    if (!existing) throw new Error("Ruta no encontrada");

    const [{ count: bookingCount }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(transportBookings)
        .where(
            and(
                eq(transportBookings.routeId, routeId),
                eq(transportBookings.status, "confirmed")
            )
        );

    if (Number(bookingCount) > 0)
        throw new Error("No se puede eliminar una ruta con reservas confirmadas");

    await db.delete(transportRoutes).where(eq(transportRoutes.id, routeId));
    return existing.eventId;
  }

  /**
   * Activa o desactiva una ruta.
   */
  static async toggleRouteActive(routeId: string, isActive: boolean) {
    await db
        .update(transportRoutes)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(transportRoutes.id, routeId));
  }

  /**
   * Habilita o deshabilita transporte para un evento.
   */
  static async toggleEventTransport(eventId: string, hasTransport: boolean, userId: string, userRole: string) {
    const [event] = await db
        .select({ id: events.id, organizerId: events.organizerId })
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);

    if (!event) throw new Error("Evento no encontrado");
    if (
        !["admin", "super_admin"].includes(userRole) &&
        event.organizerId !== userId
    )
        throw new Error("No tienes permiso para gestionar este evento");

    await db
        .update(events)
        .set({ hasTransport, updatedAt: new Date() })
        .where(eq(events.id, eventId));
  }

  /**
   * Obtiene las reservas de transporte del usuario autenticado.
   */
  static async getMyTransportBookings(userId: string) {
    return db
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
            registrationId: payments.registrationId,
        })
        .from(transportBookings)
        .innerJoin(transportRoutes, eq(transportBookings.routeId, transportRoutes.id))
        .leftJoin(
            payments,
            eq(payments.transportBookingId, transportBookings.id)
        )
        .where(eq(transportBookings.userId, userId))
        .orderBy(desc(transportBookings.bookedAt));
  }

  /**
   * Obtiene opciones disponibles de transporte para los eventos inscritos de un usuario.
   */
  static async getMemberTransportOptions(userId: string) {
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
                eq(registrations.userId, userId),
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
        .where(eq(transportBookings.userId, userId));

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

  /**
   * Crea una reserva de transporte e inserta un pago transaccional (ACID).
   */
  static async bookTransport(input: z.infer<typeof bookTransportSchema>, userId: string, userName: string) {
    const data = bookTransportSchema.parse(input);

    return db.transaction(async (tx) => {
        const [registration] = await tx
            .select()
            .from(registrations)
            .where(
                and(
                    eq(registrations.id, data.registrationId),
                    eq(registrations.userId, userId)
                )
            )
            .limit(1);

        if (!registration) throw new Error("Registro no encontrado o no te pertenece");

        const [route] = await tx
            .select()
            .from(transportRoutes)
            .where(and(eq(transportRoutes.id, data.routeId), eq(transportRoutes.isActive, true)))
            .limit(1);

        if (!route) throw new Error("Ruta no disponible");

        const [{ bookedCount }] = await tx
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

        const [existingBooking] = await tx
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

        const totalAmount = (Number(route.pricePerSeat) * data.seats).toFixed(2);

        const [booking] = await tx
            .insert(transportBookings)
            .values({
                routeId: data.routeId,
                registrationId: data.registrationId,
                userId,
                seats: data.seats,
                status: "pending",
                notes: data.notes ?? null,
            })
            .returning();

        const [payment] = await tx
            .insert(payments)
            .values({
                registrationId: data.registrationId,
                transportBookingId: booking.id,
                userId,
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

        const [event] = await tx
            .select({ title: events.title, organizerId: events.organizerId, id: events.id })
            .from(events)
            .where(eq(events.id, route.eventId))
            .limit(1);

        if (event) {
            await tx.insert(notifications).values({
                userId: event.organizerId,
                type: "payment_submitted",
                title: "Nueva reserva de transporte",
                message: `${userName} reservó ${data.seats} asiento${data.seats > 1 ? "s" : ""} en "${route.name}" para "${event.title}"`,
                metadata: {
                    bookingId: booking.id,
                    paymentId: payment.id,
                    eventId: event.id,
                    routeName: route.name,
                },
            });
        }

        return { booking, payment };
    });
  }

  /**
   * Cancela una reserva de transporte pendiente con validación de clave transaccional (ACID).
   */
  static async cancelTransportBooking(bookingId: string, userId: string, password?: string) {
    const [account] = await db
        .select({ password: accounts.password })
        .from(accounts)
        .where(
            and(
                eq(accounts.userId, userId),
                eq(accounts.providerId, "email")
            )
        )
        .limit(1);

    if (account && account.password) {
        if (!password) {
            throw new Error("Se requiere ingresar la contraseña para cancelar la reserva.");
        }
        const isPasswordValid = await verifyPassword({
            hash: account.password,
            password: password,
        });
        if (!isPasswordValid) {
            throw new Error("Contraseña incorrecta. No se pudo cancelar la reserva de transporte.");
        }
    }

    const [booking] = await db
        .select()
        .from(transportBookings)
        .where(
            and(
                eq(transportBookings.id, bookingId),
                eq(transportBookings.userId, userId)
            )
        )
        .limit(1);

    if (!booking) throw new Error("Reserva no encontrada");
    if (booking.status === "confirmed")
        throw new Error("No puedes cancelar una reserva ya confirmada. Contacta al organizador.");

    return db.transaction(async (tx) => {
        await tx
            .update(transportBookings)
            .set({ status: "cancelled", updatedAt: new Date() })
            .where(eq(transportBookings.id, bookingId));

        await tx
            .update(payments)
            .set({ status: "rejected", updatedAt: new Date(), notes: "Reserva cancelada por el usuario" })
            .where(
                and(
                    eq(payments.transportBookingId, bookingId),
                    eq(payments.status, "pending")
                )
            );
    });
  }

  /**
   * Obtiene reservas de transporte para el organizador/admin.
   */
  static async getTransportBookingsForEvent(eventId: string) {
    return db
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
  }

  /**
   * Aprueba el pago de transporte y confirma asientos (ACID).
   */
  static async approveTransportPayment(paymentId: string, verifiedByUserId: string) {
    const [payment] = await db
        .select({ id: payments.id, transportBookingId: payments.transportBookingId })
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

    if (!payment || !payment.transportBookingId)
        throw new Error("Pago de transporte no encontrado");

    return db.transaction(async (tx) => {
        await tx
            .update(payments)
            .set({
                status: "approved",
                verifiedBy: verifiedByUserId,
                verifiedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(payments.id, paymentId));

        await tx
            .update(transportBookings)
            .set({ status: "confirmed", updatedAt: new Date() })
            .where(eq(transportBookings.id, payment.transportBookingId));

        const [booking] = await tx
            .select({ userId: transportBookings.userId, routeId: transportBookings.routeId })
            .from(transportBookings)
            .where(eq(transportBookings.id, payment.transportBookingId))
            .limit(1);

        if (booking) {
            const [route] = await tx
                .select({ name: transportRoutes.name })
                .from(transportRoutes)
                .where(eq(transportRoutes.id, booking.routeId))
                .limit(1);

            await tx.insert(notifications).values({
                userId: booking.userId,
                type: "payment_status_updated",
                title: "¡Reserva de transporte confirmada!",
                message: `Tu reserva para "${route?.name ?? "la ruta"}" fue aprobada. Nos vemos en el punto de salida.`,
                metadata: { paymentId, bookingId: payment.transportBookingId },
            });
        }
    });
  }

  /**
   * Rechaza el pago de transporte y cancela reserva (ACID).
   */
  static async rejectTransportPayment(paymentId: string, verifiedByUserId: string, reason?: string) {
    const [payment] = await db
        .select({ id: payments.id, transportBookingId: payments.transportBookingId })
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

    if (!payment || !payment.transportBookingId)
        throw new Error("Pago de transporte no encontrado");

    return db.transaction(async (tx) => {
        await tx
            .update(payments)
            .set({
                status: "rejected",
                verifiedBy: verifiedByUserId,
                verifiedAt: new Date(),
                updatedAt: new Date(),
                notes: reason ?? "Rechazado por el administrador",
            })
            .where(eq(payments.id, paymentId));

        await tx
            .update(transportBookings)
            .set({ status: "cancelled", updatedAt: new Date() })
            .where(eq(transportBookings.id, payment.transportBookingId));

        const [booking] = await tx
            .select({ userId: transportBookings.userId })
            .from(transportBookings)
            .where(eq(transportBookings.id, payment.transportBookingId))
            .limit(1);

        if (booking) {
            await tx.insert(notifications).values({
                userId: booking.userId,
                type: "payment_status_updated",
                title: "Reserva de transporte rechazada",
                message: reason ?? "Tu reserva de transporte fue rechazada. Contacta al organizador.",
                metadata: { paymentId, bookingId: payment.transportBookingId },
            });
        }
    });
  }
}
