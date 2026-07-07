import { db } from "@/lib/db";
import {
    transportRoutes,
    transportBookings,
    payments,
    users,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { assertTransportPaymentInAdminScope } from "@/lib/organizations/admin-scope";
import { NotificationService, type NotificationPayload } from "@/lib/notifications/notification.service";

export class TransportAdminService {
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
  static async approveTransportPayment(
    paymentId: string,
    verifiedByUserId: string,
    verifierRole: string,
  ) {
    await assertTransportPaymentInAdminScope(paymentId, verifiedByUserId, verifierRole);

    const [payment] = await db
        .select({ id: payments.id, transportBookingId: payments.transportBookingId })
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

    if (!payment || !payment.transportBookingId)
        throw new Error("Pago de transporte no encontrado");

    const bookingId: string = payment.transportBookingId;
    let payload: NotificationPayload | null = null;

    await db.transaction(async (tx) => {
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
            .where(eq(transportBookings.id, bookingId));

        const [booking] = await tx
            .select({ userId: transportBookings.userId, routeId: transportBookings.routeId })
            .from(transportBookings)
            .where(eq(transportBookings.id, bookingId))
            .limit(1);

        if (booking) {
            const [route] = await tx
                .select({ name: transportRoutes.name, eventId: transportRoutes.eventId })
                .from(transportRoutes)
                .where(eq(transportRoutes.id, booking.routeId))
                .limit(1);

            payload = {
                userId: booking.userId,
                type: "payment_status_updated",
                title: "¡Reserva de transporte confirmada!",
                message: `Tu reserva para "${route?.name ?? "la ruta"}" fue aprobada. Nos vemos en el punto de salida.`,
                metadata: { paymentId, bookingId, eventId: route?.eventId },
            };

            await NotificationService.create(payload, tx);
        }
    });

    if (payload) await NotificationService.deliver([payload]);
  }

  /**
   * Rechaza el pago de transporte y cancela reserva (ACID).
   */
  static async rejectTransportPayment(
    paymentId: string,
    verifiedByUserId: string,
    verifierRole: string,
    reason?: string,
  ) {
    await assertTransportPaymentInAdminScope(paymentId, verifiedByUserId, verifierRole);

    const [payment] = await db
        .select({ id: payments.id, transportBookingId: payments.transportBookingId })
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

    if (!payment || !payment.transportBookingId)
        throw new Error("Pago de transporte no encontrado");

    const bookingId: string = payment.transportBookingId;
    let payload: NotificationPayload | null = null;

    await db.transaction(async (tx) => {
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
            .where(eq(transportBookings.id, bookingId));

        const [booking] = await tx
            .select({ userId: transportBookings.userId })
            .from(transportBookings)
            .where(eq(transportBookings.id, bookingId))
            .limit(1);

        if (booking) {
            payload = {
                userId: booking.userId,
                type: "payment_status_updated",
                title: "Reserva de transporte rechazada",
                message: reason ?? "Tu reserva de transporte fue rechazada. Contacta al organizador.",
                metadata: { paymentId, bookingId },
            };

            await NotificationService.create(payload, tx);
        }
    });

    if (payload) await NotificationService.deliver([payload]);
  }
}
