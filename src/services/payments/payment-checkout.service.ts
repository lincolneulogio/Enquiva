import { db } from "@/lib/db";
import {
  payments,
  registrations,
  events,
  users,
  transportBookings,
  transportRoutes,
} from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { resolveGuestRegistrationIds } from "@/lib/registrations/cleanup";

export class PaymentCheckoutService {
  /**
   * Obtiene el contexto necesario para la pasarela de pago.
   */
  static async getPaymentCheckoutContext(userId: string, registrationId: string) {
    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, registrationId))
      .limit(1);

    if (!registration || registration.userId !== userId) {
      throw new Error("Inscripción no encontrada o no te pertenece");
    }

    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, registration.eventId))
      .limit(1);

    if (!event) throw new Error("Evento no encontrado");

    const [payment] = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.registrationId, registration.id),
          eq(payments.userId, userId)
        )
      )
      .orderBy(desc(payments.createdAt))
      .limit(1);

    return { registration, event, payment: payment ?? null };
  }

  /**
   * Contexto de presentación del checkout (titular, invitados, transporte).
   * Evita queries Drizzle en Server Components de UI.
   */
  static async getCheckoutPresentationContext(
    userId: string,
    registrationId: string,
    options?: { guestFallbackName?: string },
  ) {
    const base = await PaymentCheckoutService.getPaymentCheckoutContext(userId, registrationId);
    const { registration, event, payment } = base;
    const guestFallback = options?.guestFallbackName ?? "Invitado";

    const [holderUser] = registration.userId
      ? await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, registration.userId))
          .limit(1)
      : [];
    const holderName = holderUser?.name ?? "Titular";

    let guestsDetails: Array<{ name: string; price: number }> = [];
    const guestRegIds = await resolveGuestRegistrationIds(registration);
    if (guestRegIds.length > 0) {
      const { registrationGuests } = await import("@/lib/db/schema");
      const guestRecords = await db
        .select({
          userName: users.name,
          guestName: registrationGuests.name,
        })
        .from(registrations)
        .leftJoin(users, eq(registrations.userId, users.id))
        .leftJoin(registrationGuests, eq(registrations.guestId, registrationGuests.id))
        .where(inArray(registrations.id, guestRegIds));

      guestsDetails = guestRecords.map((row) => ({
        name: row.guestName ?? row.userName ?? guestFallback,
        price: Number(event.price),
      }));
    }

    let transportDetails: {
      seats: number;
      routeName: string;
      pricePerSeat: string;
      departurePoint: string;
    } | null = null;

    if (payment?.transportBookingId) {
      const [booking] = await db
        .select({
          seats: transportBookings.seats,
          routeName: transportRoutes.name,
          pricePerSeat: transportRoutes.pricePerSeat,
          departurePoint: transportRoutes.departurePoint,
        })
        .from(transportBookings)
        .innerJoin(transportRoutes, eq(transportBookings.routeId, transportRoutes.id))
        .where(eq(transportBookings.id, payment.transportBookingId))
        .limit(1);

      if (booking) {
        transportDetails = booking;
      }
    }

    return {
      ...base,
      holderName,
      guestsDetails,
      transportDetails,
    };
  }
}
