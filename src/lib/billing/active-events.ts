import { events } from "@/lib/db/schema";
import { and, inArray, sql, type SQL } from "drizzle-orm";

/** Status that can consume a plan event slot (while the event date is still current/future). */
export const SLOT_OCCUPYING_EVENT_STATUSES = ["draft", "published"] as const;

export type SlotOccupyingEventStatus = (typeof SLOT_OCCUPYING_EVENT_STATUSES)[number];

export function isSlotOccupyingEventStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return (SLOT_OCCUPYING_EVENT_STATUSES as readonly string[]).includes(status);
}

/** Start of today in local server time (matches plan usage checks). */
export function getPlanSlotTodayStart(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Whether an event currently occupies a subscription slot:
 * draft|published AND coalesce(endDate, date) >= start of today.
 */
export function eventOccupiesPlanSlot(input: {
  status: string | null | undefined;
  date: Date | string | null | undefined;
  endDate?: Date | string | null;
}): boolean {
  if (!isSlotOccupyingEventStatus(input.status)) return false;
  const effective = input.endDate ?? input.date;
  if (!effective) return false;
  const end = effective instanceof Date ? effective : new Date(effective);
  if (Number.isNaN(end.getTime())) return false;
  return end >= getPlanSlotTodayStart();
}

/**
 * SQL filter: events that count toward maxActiveEvents.
 * Uses coalesce(end_date, date) >= start of today in the DB session timezone.
 * (Avoid passing a JS Date into sql`coalesce(...)` — neon/pg rejects it.)
 */
export function eventOccupiesPlanSlotSql(): SQL {
  return and(
    inArray(events.status, [...SLOT_OCCUPYING_EVENT_STATUSES]),
    sql`coalesce(${events.endDate}, ${events.date}) >= date_trunc('day', now())`,
  )!;
}
