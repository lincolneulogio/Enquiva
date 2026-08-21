import { and, eq, inArray, isNotNull, isNull, lt, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, payments, registrations } from "@/lib/db/schema";
import {
  promoteNextWaitlisted,
  releaseRegistrationResources,
} from "@/lib/registrations/cleanup";
import { NotificationService, type NotificationPayload } from "@/lib/notifications/notification.service";
import { holdMinutesRemaining } from "@/lib/registrations/payment-hold";
import { publishRegistrationRealtime } from "@/lib/pusher/registration-live";

/**
 * Cancela reservas vencidas (pago no completado) y libera cupo/transporte.
 * Envía recordatorio a mitad del plazo si aún no se envió.
 */
export async function processRegistrationHolds(now = new Date()) {
  const expired = await expireHolds(now);
  const reminded = await sendHoldReminders(now);
  return { expired, reminded };
}

async function expireHolds(now: Date) {
  const due = await db
    .select({
      id: registrations.id,
      eventId: registrations.eventId,
      userId: registrations.userId,
      notes: registrations.notes,
      eventTitle: events.title,
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .where(
      and(
        eq(registrations.status, "registered"),
        isNotNull(registrations.holdExpiresAt),
        lt(registrations.holdExpiresAt, now),
      ),
    )
    .limit(200);

  if (due.length === 0) return 0;

  const notifications: NotificationPayload[] = [];
  const eventIdsToPromote = new Set<string>();

  for (const row of due) {
    await db.transaction(async (tx) => {
      const [fresh] = await tx
        .select()
        .from(registrations)
        .where(eq(registrations.id, row.id))
        .limit(1);
      if (!fresh || fresh.status !== "registered") return;
      if (!fresh.holdExpiresAt || fresh.holdExpiresAt >= now) return;

      // Solo libera si sigue con pago pendiente (o sin pago aprobado)
      const [pendingPay] = await tx
        .select({ id: payments.id, status: payments.status })
        .from(payments)
        .where(eq(payments.registrationId, fresh.id))
        .limit(1);

      if (pendingPay?.status === "approved") {
        await tx
          .update(registrations)
          .set({ holdExpiresAt: null, holdReminderSentAt: null })
          .where(eq(registrations.id, fresh.id));
        return;
      }

      await releaseRegistrationResources(tx, fresh);
      await tx
        .update(registrations)
        .set({
          status: "cancelled",
          holdExpiresAt: null,
          holdReminderSentAt: null,
          notes: fresh.notes
            ? `${fresh.notes}\n[HOLD_EXPIRED:${now.toISOString()}]`
            : `[HOLD_EXPIRED:${now.toISOString()}]`,
        })
        .where(eq(registrations.id, fresh.id));

      eventIdsToPromote.add(fresh.eventId);
      if (fresh.userId) {
        notifications.push({
          userId: fresh.userId,
          type: "payment_status_updated",
          title: "Tu reserva expiró",
          message: `No se completó el pago a tiempo para "${row.eventTitle}". El cupo se liberó; puedes volver a registrarte si aún hay lugar.`,
          metadata: {
            eventId: fresh.eventId,
            registrationId: fresh.id,
            reason: "hold_expired",
          },
        });
      }
    });
  }

  for (const eventId of eventIdsToPromote) {
    const promotion = await db.transaction(async (tx) => {
      return promoteNextWaitlisted(tx, eventId);
    });

    if (promotion?.payload) {
      await NotificationService.deliver([promotion.payload]);
    }

    await publishRegistrationRealtime({
      eventId,
      userId: promotion?.userId,
      status: promotion ? "registered" : undefined,
      source: promotion ? "waitlist_promoted" : undefined,
      resource: ["registrations", "attendees", "events", "payments"],
    });
  }

  if (notifications.length > 0) {
    await NotificationService.createMany(notifications);
  }

  return notifications.length;
}

async function sendHoldReminders(now: Date) {
  // Mitad del plazo: registeredAt + (expires - registered)/2 <= now
  const candidates = await db
    .select({
      id: registrations.id,
      userId: registrations.userId,
      eventId: registrations.eventId,
      holdExpiresAt: registrations.holdExpiresAt,
      registeredAt: registrations.registeredAt,
      eventTitle: events.title,
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .where(
      and(
        eq(registrations.status, "registered"),
        isNotNull(registrations.holdExpiresAt),
        isNull(registrations.holdReminderSentAt),
        sql`${registrations.registeredAt} + ((${registrations.holdExpiresAt} - ${registrations.registeredAt}) / 2) <= ${now}`,
        lte(registrations.holdExpiresAt, sql`${now} + interval '7 days'`),
      ),
    )
    .limit(200);

  if (candidates.length === 0) return 0;

  const notifications: NotificationPayload[] = [];

  for (const row of candidates) {
    if (!row.holdExpiresAt) continue;

    const [pay] = await db
      .select({ status: payments.status })
      .from(payments)
      .where(eq(payments.registrationId, row.id))
      .limit(1);
    if (pay?.status === "approved") continue;

    const minutesLeft = holdMinutesRemaining(row.holdExpiresAt, now);
    if (minutesLeft == null || minutesLeft <= 0) continue;

    await db
      .update(registrations)
      .set({ holdReminderSentAt: now })
      .where(and(eq(registrations.id, row.id), isNull(registrations.holdReminderSentAt)));

    if (!row.userId) continue;

    notifications.push({
      userId: row.userId,
      type: "event_reminder",
      title: "Completa tu pago",
      message:
        minutesLeft >= 60
          ? `Te quedan unas ${Math.ceil(minutesLeft / 60)} h para pagar "${row.eventTitle}" o se liberará tu lugar.`
          : `Te quedan ${minutesLeft} min para pagar "${row.eventTitle}" o se liberará tu lugar.`,
      metadata: {
        eventId: row.eventId,
        registrationId: row.id,
        holdExpiresAt: row.holdExpiresAt.toISOString(),
        reason: "hold_reminder",
      },
    });
  }

  if (notifications.length > 0) {
    await NotificationService.createMany(notifications);
  }

  return notifications.length;
}
