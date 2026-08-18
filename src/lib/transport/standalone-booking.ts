import { db, type DBClient } from "@/lib/db";
import { payments, events, transportBookings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createTransportBookingInTx } from "@/lib/transport/booking";
import { NotificationService } from "@/lib/notifications/notification.service";
import { maybeNotifyTransportCapacityAlert } from "@/lib/notifications/transport-capacity-alert";
import { runBackground } from "@/lib/background";

export type StandaloneTransportPaymentInput = {
  registrationId: string;
  userId: string;
  userName: string;
  routeId: string;
  seats: number;
  method: string;
  notes?: string;
  receiptUrl?: string;
  receiptFileName?: string;
  reference?: string;
  stopId?: string | null;
};

/**
 * Reserva transporte post-inscripción + pago independiente (mismo helper de cupo que el registro).
 */
export async function bookTransportWithPayment(
  input: StandaloneTransportPaymentInput,
  tx: DBClient = db,
) {
  const run = async (innerTx: DBClient) => {
    const draft = await createTransportBookingInTx(innerTx, {
      routeId: input.routeId,
      registrationId: input.registrationId,
      userId: input.userId,
      seats: input.seats,
      stopId: input.stopId,
      notes: input.notes,
      status: "pending",
    });

    const isFree = draft.transportPrice <= 0;
    let booking = draft.booking;

    if (isFree) {
      const [confirmed] = await innerTx
        .update(transportBookings)
        .set({ status: "confirmed", updatedAt: new Date() })
        .where(eq(transportBookings.id, booking.id))
        .returning();
      booking = confirmed ?? booking;
    }

    const totalAmount = draft.transportPrice.toFixed(2);
    const { route, bookedSeats } = draft;

    const [payment] = await innerTx
      .insert(payments)
      .values({
        registrationId: input.registrationId,
        transportBookingId: booking.id,
        userId: input.userId,
        amount: totalAmount,
        currency: "PEN",
        method: input.method,
        reference: input.reference ?? null,
        receiptUrl: input.receiptUrl ?? null,
        receiptFileName: input.receiptFileName ?? null,
        status: isFree ? "approved" : "pending",
        notes: `Reserva de transporte: ${route.name} (${input.seats} asiento${input.seats > 1 ? "s" : ""})`,
      })
      .returning();

    const [event] = await innerTx
      .select({
        title: events.title,
        organizerId: events.organizerId,
        id: events.id,
        organizationId: events.organizationId,
      })
      .from(events)
      .where(eq(events.id, route.eventId))
      .limit(1);

    if (event) {
      await NotificationService.create(
        {
          userId: event.organizerId,
          type: "payment_submitted",
          title: isFree ? "Reserva de transporte confirmada" : "Nueva reserva de transporte",
          message: `${input.userName} reservó ${input.seats} asiento${input.seats > 1 ? "s" : ""} en "${route.name}" para "${event.title}"`,
          metadata: {
            bookingId: booking.id,
            paymentId: payment.id,
            eventId: event.id,
            routeName: route.name,
          },
        },
        innerTx,
      );

      runBackground(async () => {
        await NotificationService.deliver([
          {
            userId: event.organizerId,
            type: "payment_submitted",
            title: isFree ? "Reserva de transporte confirmada" : "Nueva reserva de transporte",
            message: `${input.userName} reservó ${input.seats} asiento${input.seats > 1 ? "s" : ""} en "${route.name}" para "${event.title}"`,
            metadata: {
              bookingId: booking.id,
              paymentId: payment.id,
              eventId: event.id,
              routeName: route.name,
            },
          },
        ]);

        await maybeNotifyTransportCapacityAlert({
          routeId: route.id,
          routeName: route.name,
          eventId: event.id,
          eventTitle: event.title,
          organizerId: event.organizerId,
          organizationId: event.organizationId,
          bookedSeats,
          totalSeats: route.totalSeats,
          newSeats: input.seats,
        });
      });
    }

    return { booking, payment };
  };

  if (tx === db) {
    return db.transaction(run);
  }

  return run(tx);
}
