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

const GUEST_NOTES_PREFIX = "[GUESTS:";

export function parseGuestRegistrationIds(notes: string | null | undefined): string[] {
  if (!notes?.startsWith(GUEST_NOTES_PREFIX)) return [];
  const content = notes.slice(GUEST_NOTES_PREFIX.length).replace("]", "").trim();
  if (!content) return [];
  return content.split(",").map((id) => id.trim()).filter(Boolean);
}

/** Libera transporte, pagos pendientes y tickets de una inscripción (y sus invitados). */
export async function releaseRegistrationResources(
  tx: DBTransaction,
  reg: Pick<Registration, "id" | "eventId" | "userId" | "notes">,
) {
  const guestIds = parseGuestRegistrationIds(reg.notes);

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
      .set({ status: "cancelled" })
      .where(inArray(registrations.id, guestIds));
  }
}

/** Promueve la primera persona en lista de espera cuando se libera cupo. */
export async function promoteNextWaitlisted(
  tx: DBTransaction,
  eventId: string,
): Promise<{ userId: string; payload: import("@/lib/notifications/notification.service").NotificationPayload } | null> {
  const [event] = await tx
    .select({ id: events.id, title: events.title, price: events.price })
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

  await tx
    .update(registrations)
    .set({ status: "registered", registeredAt: new Date() })
    .where(eq(registrations.id, waitlisted.id));

  const eventPrice = event.price ? Number(event.price) : 0;

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
    message: "Se liberó un lugar y quedaste inscrito desde la lista de espera.",
    metadata: { eventId, eventTitle: event.title, registrationId: waitlisted.id },
  };

  await NotificationService.create(waitlistPayload, tx);

  return { userId: waitlisted.userId, payload: waitlistPayload };
}
