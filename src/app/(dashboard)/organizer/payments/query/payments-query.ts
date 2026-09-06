import { db } from "@/lib/db";
import {
  payments as paymentsTable,
  registrations,
  events,
  users,
  transportBookings,
  transportRoutes,
  paymentStatusEnum,
} from "@/lib/db/schema";
import { eq, desc, and, gte, lte, count } from "drizzle-orm";
import type { OrganizerPaymentsSearchParams, OrganizerPaymentsQueryResult } from "./types";

export const PAGE_SIZE = 10;

export async function fetchOrganizerPayments({
  organizerId,
  params,
}: {
  organizerId: string;
  params: OrganizerPaymentsSearchParams;
}): Promise<OrganizerPaymentsQueryResult> {
  const requestedPage = Number(params.page ?? "1");
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  const conditions = [eq(events.organizerId, organizerId)];

  if (params.eventId) {
    conditions.push(eq(events.id, params.eventId));
  }
  if (params.category) {
    conditions.push(eq(events.category, params.category));
  }
  if (params.status && params.status !== "all") {
    const status = paymentStatusEnum.enumValues.find((value) => value === params.status);
    if (status) {
      conditions.push(eq(paymentsTable.status, status));
    }
  }
  if (params.fromDate) {
    conditions.push(gte(paymentsTable.createdAt, new Date(`${params.fromDate}T00:00:00.000`)));
  }
  if (params.toDate) {
    conditions.push(lte(paymentsTable.createdAt, new Date(`${params.toDate}T23:59:59.999`)));
  }

  const whereClause = and(...conditions);

  const [{ total }] = await db
    .select({ total: count() })
    .from(paymentsTable)
    .innerJoin(registrations, eq(paymentsTable.registrationId, registrations.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(users, eq(paymentsTable.userId, users.id))
    .where(whereClause);

  const pendingConditions = [...conditions, eq(paymentsTable.status, "pending")];
  const [{ pendingCount }] = await db
    .select({ pendingCount: count() })
    .from(paymentsTable)
    .innerJoin(registrations, eq(paymentsTable.registrationId, registrations.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .where(and(...pendingConditions));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;

  const payments = await db
    .select({
      payment: paymentsTable,
      registration: registrations,
      event: events,
      attendee: users,
      transportBooking: transportBookings,
      transportRoute: transportRoutes,
    })
    .from(paymentsTable)
    .innerJoin(registrations, eq(paymentsTable.registrationId, registrations.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(users, eq(paymentsTable.userId, users.id))
    .leftJoin(transportBookings, eq(transportBookings.id, paymentsTable.transportBookingId))
    .leftJoin(transportRoutes, eq(transportRoutes.id, transportBookings.routeId))
    .where(whereClause)
    .orderBy(desc(paymentsTable.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  return {
    payments,
    total,
    totalPages,
    safePage,
    pendingCount,
    pageSize: PAGE_SIZE,
  };
}
