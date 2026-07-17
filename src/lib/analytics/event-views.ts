import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq, sql, and, gte, lte, type SQL } from "drizzle-orm";
import { andWithScope } from "@/lib/organizations/admin-scope";
import { redis } from "@/lib/redis";
import { runBackground } from "@/lib/background";

const VIEW_FLUSH_WINDOW_SECONDS = 60;
const VIEW_PENDING_TTL_SECONDS = 60 * 60 * 24 * 7;

async function incrementEventViewCount(eventId: string, amount: number) {
  await db
    .update(events)
    .set({
      viewCount: sql`${events.viewCount} + ${amount}`,
    })
    .where(eq(events.id, eventId));
}

/**
 * La visita no bloquea el GET público. Redis acumula incrementos y permite como
 * máximo un UPDATE por evento/ventana; si no llega otra visita, el pendiente
 * queda durable hasta siete días y se vacía en la siguiente.
 */
export function recordEventView(eventId: string): void {
  runBackground(async () => {
    const pendingKey = `metrics:event-views:pending:${eventId}`;
    const flushLockKey = `metrics:event-views:flush:${eventId}`;

    try {
      await redis.incr(pendingKey);
      await redis.expire(pendingKey, VIEW_PENDING_TTL_SECONDS);
      const acquired = await redis.set(flushLockKey, "1", {
        nx: true,
        ex: VIEW_FLUSH_WINDOW_SECONDS,
      });
      if (!acquired) return;

      const pending = Number((await redis.getdel<number>(pendingKey)) ?? 0);
      if (pending > 0) await incrementEventViewCount(eventId, pending);
    } catch (error) {
      // Métrica no crítica: una caída de Redis nunca debe degradar la página pública.
      console.error("[event-views] No se pudo registrar la vista diferida:", error);
    }
  });
}

export async function sumEventViews(options: {
  eventScope?: SQL;
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
}) {
  const dateConditions: SQL[] = [];
  if (options.rangeStart) dateConditions.push(gte(events.createdAt, options.rangeStart));
  if (options.rangeEnd) dateConditions.push(lte(events.createdAt, options.rangeEnd));

  const where = andWithScope(dateConditions, options.eventScope);

  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${events.viewCount}), 0)`,
    })
    .from(events)
    .where(where);

  return Number(row?.total ?? 0);
}
