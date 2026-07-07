import { db } from "@/lib/db";
import { events, registrations, users } from "@/lib/db/schema";
import { and, eq, inArray, isNull, lt, not, or, sql } from "drizzle-orm";
import { invalidateCachePattern } from "@/lib/redis";
import { releaseRegistrationResources } from "@/lib/registrations/cleanup";
import { NotificationService } from "@/lib/notifications/notification.service";

/**
 * Marca como completados los eventos publicados cuya fecha (o fin) ya pasó.
 */
export async function markPastPublishedEventsCompleted() {
  const now = new Date();

  const updated = await db
    .update(events)
    .set({ status: "completed", updatedAt: now })
    .where(
      and(
        eq(events.status, "published"),
        or(
          and(not(isNull(events.endDate)), lt(events.endDate, now)),
          and(isNull(events.endDate), lt(events.date, now)),
        ),
      ),
    )
    .returning({ id: events.id });

  if (updated.length > 0) {
    await invalidateCachePattern("events:*");
  }

  return { completed: updated.length, eventIds: updated.map((e) => e.id) };
}

/**
 * Cancela inscripciones activas y notifica cuando un evento pasa a cancelado.
 */
export async function cascadeEventCancellation(eventId: string, eventTitle: string) {
  const result = await db.transaction(async (tx) => {
    const activeRegs = await tx
      .select()
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, eventId),
          inArray(registrations.status, ["registered", "checked_in", "waitlisted"]),
        ),
      );

    for (const reg of activeRegs) {
      await releaseRegistrationResources(tx, reg);
      await tx
        .update(registrations)
        .set({ status: "cancelled" })
        .where(eq(registrations.id, reg.id));
    }

    const payloads =
      activeRegs.length > 0
        ? activeRegs.map((reg) => ({
            userId: reg.userId,
            type: "event_cancelled" as const,
            title: "Evento cancelado",
            message: `El evento "${eventTitle}" fue cancelado. Tu inscripción ya no está activa.`,
            metadata: { eventId, eventTitle, registrationId: reg.id },
          }))
        : [];

    if (payloads.length > 0) {
      await NotificationService.createMany(payloads, tx);
    }

    return { cancelledRegistrations: activeRegs.length, payloads };
  });

  if (result.payloads.length > 0) {
    await NotificationService.deliver(result.payloads);
  }

  return { cancelledRegistrations: result.cancelledRegistrations };
}

/**
 * Elimina usuarios guest_* / offline_* sin inscripciones activas.
 */
export async function cleanupOrphanGuestUsers() {
  const orphanUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(
      or(
        sql`${users.id} LIKE 'guest\\_%'`,
        sql`${users.id} LIKE 'offline\\_%'`,
      ),
    );

  let deleted = 0;

  for (const user of orphanUsers) {
    const [activeReg] = await db
      .select({ id: registrations.id })
      .from(registrations)
      .where(
        and(
          eq(registrations.userId, user.id),
          inArray(registrations.status, ["registered", "checked_in", "waitlisted"]),
        ),
      )
      .limit(1);

    if (activeReg) continue;

    await db.delete(users).where(eq(users.id, user.id));
    deleted += 1;
  }

  return { scanned: orphanUsers.length, deleted };
}
