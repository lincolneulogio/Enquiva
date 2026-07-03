import { db } from "@/lib/db";
import {
  transportRoutes,
  transportBookings,
  registrations,
  events,
  accounts,
  payments,
} from "@/lib/db/schema";
import { verifyPassword } from "better-auth/crypto";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { bookTransportWithPayment } from "@/lib/transport/standalone-booking";

export const bookTransportSchema = z.object({
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
  static async bookTransport(input: z.infer<typeof bookTransportSchema>, userId: string, userName: string) {
    const data = bookTransportSchema.parse(input);

    const [registration] = await db
      .select()
      .from(registrations)
      .where(and(eq(registrations.id, data.registrationId), eq(registrations.userId, userId)))
      .limit(1);

    if (!registration) throw new Error("Registro no encontrado o no te pertenece");

    if (registration.status !== "registered" && registration.status !== "checked_in") {
      throw new Error("Solo puedes reservar transporte con una inscripción activa");
    }

    return bookTransportWithPayment({
      registrationId: data.registrationId,
      userId,
      userName,
      routeId: data.routeId,
      seats: data.seats,
      method: data.method,
      notes: data.notes,
      receiptUrl: data.receiptUrl,
      receiptFileName: data.receiptFileName,
      reference: data.reference,
      stopId: data.stopId,
    });
  }

  static async cancelTransportBooking(bookingId: string, userId: string, password?: string) {
    const [account] = await db
      .select({ password: accounts.password })
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "email")))
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
      .where(and(eq(transportBookings.id, bookingId), eq(transportBookings.userId, userId)))
      .limit(1);

    if (!booking) throw new Error("Reserva no encontrada");
    if (booking.status === "confirmed") {
      throw new Error("No puedes cancelar una reserva ya confirmada. Contacta al organizador.");
    }

    return db.transaction(async (tx) => {
      await tx
        .update(transportBookings)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(transportBookings.id, bookingId));

      await tx
        .update(payments)
        .set({ status: "rejected", updatedAt: new Date(), notes: "Reserva cancelada por el usuario" })
        .where(and(eq(payments.transportBookingId, bookingId), eq(payments.status, "pending")));
    });
  }
}
