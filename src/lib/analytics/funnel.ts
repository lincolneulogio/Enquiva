import { db } from "@/lib/db";
import { events, registrations, payments } from "@/lib/db/schema";
import { and, count, eq, inArray } from "drizzle-orm";
import { sumEventViews } from "@/lib/analytics/event-views";
import { occupyingCapacityCondition } from "@/lib/registrations/capacity";

export type EventFunnelStats = {
  views: number;
  registrations: number;
  paid: number;
  checkedIn: number;
  waitlisted: number;
  rates: {
    viewToRegister: number | null;
    registerToPaid: number | null;
    paidToCheckIn: number | null;
  };
};

function rate(num: number, den: number): number | null {
  if (den <= 0) return null;
  return Math.round((num / den) * 1000) / 10;
}

/**
 * Embudo por organizador (o un evento): vistas → inscritos → pagados → check-in.
 */
export async function getOrganizerFunnelStats(input: {
  organizerId: string;
  eventId?: string;
}): Promise<EventFunnelStats> {
  const eventFilter = input.eventId
    ? and(eq(events.id, input.eventId), eq(events.organizerId, input.organizerId))
    : eq(events.organizerId, input.organizerId);

  const eventRows = await db
    .select({ id: events.id })
    .from(events)
    .where(eventFilter);

  const eventIds = eventRows.map((e) => e.id);
  if (eventIds.length === 0) {
    return {
      views: 0,
      registrations: 0,
      paid: 0,
      checkedIn: 0,
      waitlisted: 0,
      rates: { viewToRegister: null, registerToPaid: null, paidToCheckIn: null },
    };
  }

  const views = await sumEventViews({
    eventScope: inArray(events.id, eventIds),
  });

  const [[{ registrationsCount }], [{ checkedIn }], [{ waitlisted }], [{ paid }]] =
    await Promise.all([
      db
        .select({ registrationsCount: count() })
        .from(registrations)
        .where(
          and(
            inArray(registrations.eventId, eventIds),
            inArray(registrations.status, ["registered", "checked_in"]),
          ),
        ),
      db
        .select({ checkedIn: count() })
        .from(registrations)
        .where(
          and(
            inArray(registrations.eventId, eventIds),
            eq(registrations.status, "checked_in"),
          ),
        ),
      db
        .select({ waitlisted: count() })
        .from(registrations)
        .where(
          and(
            inArray(registrations.eventId, eventIds),
            eq(registrations.status, "waitlisted"),
          ),
        ),
      db
        .select({ paid: count() })
        .from(payments)
        .innerJoin(registrations, eq(payments.registrationId, registrations.id))
        .where(
          and(
            inArray(registrations.eventId, eventIds),
            eq(payments.status, "approved"),
          ),
        ),
    ]);

  const regN = Number(registrationsCount ?? 0);
  const paidN = Number(paid ?? 0);
  const checkN = Number(checkedIn ?? 0);

  return {
    views,
    registrations: regN,
    paid: paidN,
    checkedIn: checkN,
    waitlisted: Number(waitlisted ?? 0),
    rates: {
      viewToRegister: rate(regN, views),
      registerToPaid: rate(paidN, regN),
      paidToCheckIn: rate(checkN, paidN > 0 ? paidN : regN),
    },
  };
}

/** Helpers unused warning avoid - keeping occupying for future per-event edit */
export async function countOccupiedForEvent(eventId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(registrations)
    .where(occupyingCapacityCondition(eventId));
  return Number(row?.n ?? 0);
}
