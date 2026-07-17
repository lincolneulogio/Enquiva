import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { payments, registrations } from "@/lib/db/schema";

export type ViewerEventStatus =
  | "guest"
  | "not_registered"
  | "registered"
  | "reserved"
  | "reservation_expired"
  | "paid"
  | "payment_rejected"
  | "waitlisted"
  | "checked_in";

export const VIEWER_EVENT_STATUS_I18N_KEY: Record<ViewerEventStatus, string> = {
  guest: "public.events.viewerStatus.guest",
  not_registered: "public.events.viewerStatus.notRegistered",
  registered: "public.events.viewerStatus.registered",
  reserved: "public.events.viewerStatus.reserved",
  reservation_expired: "public.events.viewerStatus.reservationExpired",
  paid: "public.events.viewerStatus.paid",
  payment_rejected: "public.events.viewerStatus.paymentRejected",
  waitlisted: "public.events.viewerStatus.waitlisted",
  checked_in: "public.events.viewerStatus.checkedIn",
};

type ViewerRegistrationRow = {
  eventId: string;
  registrationStatus: string;
  holdExpiresAt: Date | null;
  paymentStatus: string | null;
};

export function resolveViewerEventStatus(
  rows: ViewerRegistrationRow[],
  now = new Date(),
): ViewerEventStatus {
  if (rows.length === 0) return "not_registered";

  const registrationStatus = rows[0].registrationStatus;
  if (registrationStatus === "checked_in") return "checked_in";
  if (registrationStatus === "waitlisted") return "waitlisted";

  const paymentStatuses = rows
    .map((row) => row.paymentStatus)
    .filter((status): status is string => Boolean(status));

  if (paymentStatuses.includes("approved")) return "paid";
  if (paymentStatuses.includes("pending")) {
    const holdExpiresAt = rows[0].holdExpiresAt;
    return holdExpiresAt && holdExpiresAt.getTime() <= now.getTime()
      ? "reservation_expired"
      : "reserved";
  }
  if (paymentStatuses.includes("rejected")) return "payment_rejected";
  return "registered";
}

export async function getViewerEventStatuses(
  userId: string,
  eventIds: string[],
): Promise<Map<string, ViewerEventStatus>> {
  if (eventIds.length === 0) return new Map();

  const rows = await db
    .select({
      eventId: registrations.eventId,
      registrationStatus: registrations.status,
      holdExpiresAt: registrations.holdExpiresAt,
      paymentStatus: payments.status,
    })
    .from(registrations)
    .leftJoin(payments, eq(payments.registrationId, registrations.id))
    .where(
      and(
        eq(registrations.userId, userId),
        inArray(registrations.eventId, eventIds),
        ne(registrations.status, "cancelled"),
      ),
    );

  const byEvent = new Map<string, ViewerRegistrationRow[]>();
  for (const row of rows) {
    const current = byEvent.get(row.eventId) ?? [];
    current.push(row);
    byEvent.set(row.eventId, current);
  }

  const statuses = new Map<string, ViewerEventStatus>();
  for (const eventId of eventIds) {
    statuses.set(
      eventId,
      resolveViewerEventStatus(byEvent.get(eventId) ?? []),
    );
  }
  return statuses;
}
