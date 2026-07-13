import { and, eq, gt, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { registrations } from "@/lib/db/schema";
import { OCCUPYING_REGISTRATION_STATUSES } from "@/lib/registrations/constants";

/**
 * Cupos ocupados: registered/checked_in con hold vigente o sin hold
 * (gratis / ya pagado). Holds vencidos no cuentan aunque el cron aún no los cancele.
 */
export function occupyingCapacityCondition(eventId: string, now = new Date()): SQL {
  return and(
    eq(registrations.eventId, eventId),
    inArray(registrations.status, [...OCCUPYING_REGISTRATION_STATUSES]),
    or(isNull(registrations.holdExpiresAt), gt(registrations.holdExpiresAt, now)),
  )!;
}

/** Variante sin filtrar por evento (p. ej. conteos genéricos). */
export function occupyingStatusWithActiveHold(now = new Date()): SQL {
  return and(
    inArray(registrations.status, [...OCCUPYING_REGISTRATION_STATUSES]),
    or(isNull(registrations.holdExpiresAt), gt(registrations.holdExpiresAt, now)),
  )!;
}

export function sqlOccupyingCapacityFilter(now = new Date()) {
  return sql`(${registrations.status} IN ('registered', 'checked_in') AND (${registrations.holdExpiresAt} IS NULL OR ${registrations.holdExpiresAt} > ${now}))`;
}
