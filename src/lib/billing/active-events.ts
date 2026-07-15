import { events } from "@/lib/db/schema";
import { and, inArray, sql, type SQL } from "drizzle-orm";

/** Canonical timezone for plan-slot day boundaries. */
export const PLAN_SLOT_TIMEZONE = "America/Lima";

/** Status that can consume a plan event slot (while the event date is still current/future). */
export const SLOT_OCCUPYING_EVENT_STATUSES = ["draft", "published"] as const;

export type SlotOccupyingEventStatus = (typeof SLOT_OCCUPYING_EVENT_STATUSES)[number];

export function isSlotOccupyingEventStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return (SLOT_OCCUPYING_EVENT_STATUSES as readonly string[]).includes(status);
}

/** YYYY-MM-DD for "today" in America/Lima. */
export function getPlanSlotTodayYmd(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PLAN_SLOT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Start of today in America/Lima as a Date (for in-memory comparisons).
 * Peru has no DST; fixed UTC-5.
 */
export function getPlanSlotTodayStart(): Date {
  const ymd = getPlanSlotTodayYmd();
  return new Date(`${ymd}T00:00:00-05:00`);
}

/**
 * Whether an event currently occupies a subscription slot:
 * draft|published AND coalesce(endDate, date) >= start of today (America/Lima).
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
 * Day boundary locked to America/Lima (same as JS helpers).
 */
export function eventOccupiesPlanSlotSql(): SQL {
  return and(
    inArray(events.status, [...SLOT_OCCUPYING_EVENT_STATUSES]),
    sql`((coalesce(${events.endDate}, ${events.date}) AT TIME ZONE 'America/Lima')::date >= (timezone('America/Lima', now()))::date)`,
  )!;
}
