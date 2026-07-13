import { eq, and, inArray, sql } from "drizzle-orm";
import type { DBTransaction } from "@/lib/db";
import {
  registrations,
  tickets,
  payments,
  transportBookings,
  events,
  type Registration,
} from "@/lib/db/schema";
import { generateTicketForRegistration } from "@/lib/tickets";
import { NotificationService } from "@/lib/notifications/notification.service";
import { computeInitialHoldExpiresAt } from "@/lib/registrations/payment-hold";
import {
  parseGuestRegistrationIds,
  resolveGuestRegistrationIds,
} from "@/lib/registrations/guests";

export { parseGuestRegistrationIds, resolveGuestRegistrationIds } from "@/lib/registrations/guests";

/** Libera transporte, pagos pendientes y tickets de una inscripción (y sus invitados). */
export async function releaseRegistrationResources(
  tx: DBTransaction,
  reg: Pick<Registration, "id" | "eventId" | "userId" | "notes">,
) {
  const guestIds = await resolveGuestRegistrationIds(reg, tx);

  const registrationIds = [reg.id, ...guestIds];

  await tx
    .update(transportBookings)
    .set({ status: "cancelled" })
    .where(
      and(
        inArray(transportBookings.registrationId, registrationIds),
        sql`${transportBookings.status} != 'cancelled'`,
      ),
    );

  await tx
    .update(payments)
    .set({ status: "rejected", notes: "Inscripción cancelada", updatedAt: new Date() })
    .where(
      and(
        inArray(payments.registrationId, registrationIds),
        eq(payments.status, "pending"),
      ),
    );

  await tx
    .update(tickets)
    .set({ status: "cancelled" })
    .where(inArray(tickets.registrationId, registrationIds));

  if (guestIds.length > 0) {
    await tx
      .update(registrations)
      .set({
        status: "cancelled",
        holdExpiresAt: null,
        holdReminderSentAt: null,
      })
      .where(inArray(registrations.id, guestIds));
  }
}

/** Promueve la primera persona en lista de espera cuando se libera cupo. */
export async function promoteNextWaitlisted(
  tx: DBTransaction,
  eventId: string,
): Promise<{ userId: string; payload: import("@/lib/notifications/notification.service").NotificationPayload } | null> {
  const [event] = await tx
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) return null;

  const [waitlisted] = await tx
    .select()
    .from(registrations)
    .where(and(eq(registrations.eventId, eventId), eq(registrations.status, "waitlisted")))
    .orderBy(registrations.registeredAt)
    .limit(1);

  if (!waitlisted) return null;

  const now = new Date();
  const eventPrice = event.price ? Number(event.price) : 0;
  const hold =
    eventPrice > 0 ? computeInitialHoldExpiresAt(event, now) : { expiresAt: null as Date | null, minutes: null as number | null };

  await tx
    .update(registrations)
    .set({
      status: "registered",
      registeredAt: now,
      holdExpiresAt: hold.expiresAt,
      holdReminderSentAt: null,
    })
    .where(eq(registrations.id, waitlisted.id));

  if (eventPrice > 0) {
    await tx.insert(payments).values({
      registrationId: waitlisted.id,
      userId: waitlisted.userId,
      amount: eventPrice.toFixed(2),
      currency: "PEN",
      status: "pending",
      notes: "Pago pendiente tras promoción desde lista de espera",
    });
  } else {
    await generateTicketForRegistration(waitlisted.id, eventId, waitlisted.userId, tx);
  }

  const waitlistPayload = {
    userId: waitlisted.userId,
    type: "waitlist_promoted" as const,
    title: "¡Buenas noticias! Tienes cupo",
    message:
      eventPrice > 0 && hold.minutes
        ? `Se liberó un lugar en "${event.title}". Tienes ${hold.minutes} min para pagar o se liberará de nuevo.`
        : "Se liberó un lugar y quedaste inscrito desde la lista de espera.",
    metadata: {
      eventId,
      eventTitle: event.title,
      registrationId: waitlisted.id,
      holdExpiresAt: hold.expiresAt?.toISOString() ?? null,
    },
  };

  await NotificationService.create(waitlistPayload, tx);

  return { userId: waitlisted.userId, payload: waitlistPayload };
}
