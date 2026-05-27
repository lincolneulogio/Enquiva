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
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

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

export class BookingService {
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
                    sql`${transportBookings.status} != 'cancelled'`
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
                stopId: data.stopId ?? null,
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
}
