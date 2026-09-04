import { db } from "@/lib/db";
import { registrations } from "@/lib/db/schema";
import { and, count, eq } from "drizzle-orm";
import { occupyingCapacityCondition } from "@/lib/registrations/capacity";

import type { ResolvedPlan } from "@/lib/billing/types";

export type EventCapacitySnapshot = {
  capacity: number | null;
  occupied: number;
  waitlisted: number;
  remaining: number | null;
  isFull: boolean;
};

export type EventCapacitySnapshotOptions = {
  organizerId?: string | null;
  plan?: ResolvedPlan | null;
};

/**
 * Cupos vivos: ocupados (registered/checked_in con hold vigente) + waitlist.
 * Resuelve la capacidad efectiva respetando el límite del plan del organizador
 * (maxAttendeesPerEvent) si no se fijó capacidad o si el plan define un máximo menor.
 */
export async function getEventCapacitySnapshot(
  eventId: string,
  capacity?: number | null | undefined,
  options?: EventCapacitySnapshotOptions,
): Promise<EventCapacitySnapshot> {
  let plan = options?.plan;
  if (plan === undefined) {
    const { getOrganizerPlanForEvent } = await import("@/lib/billing/enforce");
    plan = await getOrganizerPlanForEvent(
      options?.organizerId ? { organizerId: options.organizerId } : eventId,
    );
  }

  const { getEffectiveEventCapacity } = await import("@/lib/billing/enforce");
  const effectiveCap = getEffectiveEventCapacity(
    capacity == null ? null : Number(capacity),
    plan,
  );

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
  const remaining = effectiveCap == null ? null : Math.max(0, effectiveCap - occ);

  return {
    capacity: effectiveCap,
    occupied: occ,
    waitlisted: wait,
    remaining,
    isFull: effectiveCap != null && occ >= effectiveCap,
  };
}
