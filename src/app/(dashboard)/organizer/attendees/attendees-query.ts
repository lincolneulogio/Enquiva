import { db } from "@/lib/db";
import { registrations, events, users, registrationStatusEnum, registrationGuests } from "@/lib/db/schema";
import { eq, desc, and, gte, lte, count, sql } from "drizzle-orm";
import { getExportEventOptions } from "@/actions/exports";

export const ATTENDEES_PAGE_SIZE = 10;

export interface AttendeeQueryParams {
  page?: string;
  eventId?: string;
  category?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export async function getOrganizerAttendees(organizerId: string, params: AttendeeQueryParams) {
  const requestedPage = Number(params.page ?? "1");
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.floor(requestedPage)
      : 1;

  const eventOptions = await getExportEventOptions("organizer");

  const conditions = [eq(events.organizerId, organizerId)];

  if (params.eventId) {
    conditions.push(eq(events.id, params.eventId));
  }
  if (params.category) {
    conditions.push(eq(events.category, params.category));
  }
  if (params.status && params.status !== "all") {
    const status = registrationStatusEnum.enumValues.find((value) => value === params.status);
    if (status) {
      conditions.push(eq(registrations.status, status));
    }
  }
  if (params.fromDate) {
    conditions.push(
      gte(
        registrations.registeredAt,
        new Date(`${params.fromDate}T00:00:00.000`),
      ),
    );
  }
  if (params.toDate) {
    conditions.push(
      lte(
        registrations.registeredAt,
        new Date(`${params.toDate}T23:59:59.999`),
      ),
    );
  }

  const whereClause = and(...conditions);

  const [{ total }] = await db
    .select({ total: count() })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .leftJoin(users, eq(registrations.userId, users.id))
    .leftJoin(registrationGuests, eq(registrations.guestId, registrationGuests.id))
    .where(whereClause);

  const totalPages = Math.max(1, Math.ceil(total / ATTENDEES_PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const offset = (safePage - 1) * ATTENDEES_PAGE_SIZE;

  const rows = await db
    .select({
      registrationId: registrations.id,
      eventId: events.id,
      status: registrations.status,
      registeredAt: registrations.registeredAt,
      checkedInAt: registrations.checkedInAt,
      selectedScheduleLabel: registrations.selectedScheduleLabel,
      wantsCertificate: registrations.wantsCertificate,
      certificateCode: registrations.certificateCode,
      eventTitle: events.title,
      eventDate: events.date,
      eventSlug: events.slug,
      eventLocation: events.location,
      isVirtual: events.isVirtual,
      hasCertificate: events.hasCertificate,
      certificateTitle: events.certificateTitle,
      certificatePrice: events.certificatePrice,
      eventEndDate: events.endDate,
      userName: sql<string>`coalesce(${registrationGuests.name}, ${users.name}, 'Asistente')`,
      userEmail: users.email,
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .leftJoin(users, eq(registrations.userId, users.id))
    .leftJoin(registrationGuests, eq(registrations.guestId, registrationGuests.id))
    .where(whereClause)
    .orderBy(desc(registrations.registeredAt))
    .limit(ATTENDEES_PAGE_SIZE)
    .offset(offset);

  return {
    total,
    totalPages,
    safePage,
    rows,
    eventOptions,
  };
}

export type AttendeeRow = Awaited<ReturnType<typeof getOrganizerAttendees>>["rows"][number];
