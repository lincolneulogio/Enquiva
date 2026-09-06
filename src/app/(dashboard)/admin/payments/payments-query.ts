import { db } from "@/lib/db";
import {
  payments,
  registrations,
  events,
  users,
  transportBookings,
  transportRoutes,
  paymentStatusEnum,
} from "@/lib/db/schema";
import { eq, desc, and, gte, lte, count, type SQL } from "drizzle-orm";
import { scopeEventCondition, type AdminScope } from "@/lib/organizations/admin-scope";
import { getPaymentEarningsReport } from "@/lib/payments/earnings-report";

export interface AdminPaymentsQueryParams {
  eventId?: string;
  category?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export async function fetchAdminPaymentsData({
  params,
  adminScope,
  currentPage,
  pageSize,
}: {
  params: AdminPaymentsQueryParams;
  adminScope: AdminScope;
  currentPage: number;
  pageSize: number;
}) {
  const orgEventFilter = scopeEventCondition(adminScope);
  const reportStatus = paymentStatusEnum.enumValues.find(
    (value) => value === params.status,
  );

  const earningsScope =
    adminScope.mode === "org"
      ? ({ mode: "organization", organizationId: adminScope.organizationId } as const)
      : adminScope.mode === "platform"
        ? ({ mode: "platform" } as const)
        : null;

  const earningsReport = earningsScope
    ? await getPaymentEarningsReport(earningsScope, {
        eventId: params.eventId,
        category: params.category,
        status: reportStatus,
        fromDate: params.fromDate,
        toDate: params.toDate,
      })
    : { currencies: [], events: [] };

  const conditions: SQL[] = [];
  if (orgEventFilter) {
    conditions.push(orgEventFilter);
  }
  if (params.eventId) {
    conditions.push(eq(events.id, params.eventId));
  }
  if (params.category) {
    conditions.push(eq(events.category, params.category));
  }
  if (params.status && params.status !== "all") {
    const status = paymentStatusEnum.enumValues.find((value) => value === params.status);
    if (status) {
      conditions.push(eq(payments.status, status));
    }
  }
  if (params.fromDate) {
    conditions.push(gte(payments.createdAt, new Date(`${params.fromDate}T00:00:00.000`)));
  }
  if (params.toDate) {
    conditions.push(lte(payments.createdAt, new Date(`${params.toDate}T23:59:59.999`)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(payments)
    .innerJoin(registrations, eq(payments.registrationId, registrations.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(users, eq(payments.userId, users.id))
    .where(whereClause);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const offset = (safePage - 1) * pageSize;

  const allPayments = await db
    .select({
      payment: payments,
      registration: registrations,
      event: events,
      attendee: users,
      transportBooking: transportBookings,
      transportRoute: transportRoutes,
    })
    .from(payments)
    .innerJoin(registrations, eq(payments.registrationId, registrations.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(users, eq(payments.userId, users.id))
    .leftJoin(
      transportBookings,
      eq(transportBookings.id, payments.transportBookingId),
    )
    .leftJoin(
      transportRoutes,
      eq(transportRoutes.id, transportBookings.routeId),
    )
    .where(whereClause)
    .orderBy(desc(payments.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    total,
    totalPages,
    safePage,
    offset,
    allPayments,
    earningsReport,
  };
}
