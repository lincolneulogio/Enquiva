import { db } from "@/lib/db";
import { registrations } from "@/lib/db/schema";
import { and, count, eq } from "drizzle-orm";
import { occupyingCapacityCondition } from "@/lib/registrations/capacity";

export type EventCapacitySnapshot = {
  capacity: number | null;
  occupied: number;
  waitlisted: number;
  remaining: number | null;
  isFull: boolean;
};

/**
 * Cupos vivos: ocupados (registered/checked_in con hold vigente) + waitlist.
 */
export async function getEventCapacitySnapshot(
  eventId: string,
  capacity: number | null | undefined,
): Promise<EventCapacitySnapshot> {
  const cap = capacity == null ? null : Number(capacity);

  const [[{ occupied }], [{ waitlisted }]] = await Promise.all([
    db
      .select({ occupied: count() })
      .from(registrations)
      .where(occupyingCapacityCondition(eventId)),
    db
      .select({ waitlisted: count() })
      .from(registrations)
      .where(and(eq(registrations.eventId, eventId), eq(registrations.status, "waitlisted"))),
  ]);

  const occ = Number(occupied ?? 0);
  const wait = Number(waitlisted ?? 0);
  const remaining = cap == null ? null : Math.max(0, cap - occ);

  return {
    capacity: cap,
    occupied: occ,
    waitlisted: wait,
    remaining,
    isFull: cap != null && occ >= cap,
  };
}
