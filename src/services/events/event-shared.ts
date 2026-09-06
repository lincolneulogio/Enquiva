import { registrations, events } from "@/lib/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { and, inArray, isNull, or, gt, sql } from "drizzle-orm";
import { OCCUPYING_REGISTRATION_STATUSES } from "@/lib/registrations/constants";

/**
 * Asistentes confirmados: registered/checked_in que ya pagaron (ticket QR emitido)
 * o eventos gratuitos sin hold pendiente. Excluye reservas temporales pendientes de pago.
 */
export const confirmedAttendeeStatus = and(
  inArray(registrations.status, [...OCCUPYING_REGISTRATION_STATUSES]),
  isNull(registrations.holdExpiresAt),
);

/** registered/checked_in con hold vigente (o sin hold) para aforo y reserva de cupos. */
export const activeOccupyingStatus = and(
  inArray(registrations.status, [...OCCUPYING_REGISTRATION_STATUSES]),
  or(isNull(registrations.holdExpiresAt), gt(registrations.holdExpiresAt, sql`now()`)),
);

export type PublicEventsResult = {
  events: (InferSelectModel<typeof events> & { attendeeCount: number })[];
  total: number;
  totalRegistrations: number;
  page: number;
  limit: number;
};

export type EventWithAttendeeCount = InferSelectModel<typeof events> & { attendeeCount: number };
