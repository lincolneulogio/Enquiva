import { db } from "@/lib/db";
import { payments, registrations, transportBookings, transportRoutes } from "@/lib/db/schema";
import { count, eq, gte, sql, type SQL } from "drizzle-orm";
import { andWithScope } from "@/lib/organizations/admin-scope";
import { sumEventViews } from "@/lib/analytics/event-views";

interface FinancialTransportOptions {
  rangeStart: Date | null;
  paymentOrgScope?: SQL;
  transportRouteOrgScope?: SQL;
  transportBookingOrgScope?: SQL;
  registrationsWhere?: SQL;
  eventOrgScope?: SQL;
}

export async function queryFinancialAndTransportStats({
  rangeStart,
  paymentOrgScope,
  transportRouteOrgScope,
  transportBookingOrgScope,
  registrationsWhere,
  eventOrgScope,
}: FinancialTransportOptions) {
  const revenueWhere = andWithScope(
    [eq(payments.status, "approved")],
    rangeStart ? gte(payments.createdAt, rangeStart) : undefined,
    paymentOrgScope,
  );

  const pendingWhere = andWithScope([eq(payments.status, "pending")], paymentOrgScope);

  const paymentMethodsWhere = andWithScope(
    [eq(payments.status, "approved")],
    rangeStart ? gte(payments.createdAt, rangeStart) : undefined,
    paymentOrgScope,
  );

  const transportRoutesWhere = andWithScope(
    rangeStart ? [gte(transportRoutes.createdAt, rangeStart)] : [],
    transportRouteOrgScope,
  );

  const transportBookingsWhere = andWithScope(
    [eq(transportBookings.status, "confirmed")],
    rangeStart ? gte(transportBookings.bookedAt, rangeStart) : undefined,
    transportBookingOrgScope,
  );

  const [
    [revenueResult],
    [truePendingResult],
    rawPaymentMethodsStats,
    [transportStats],
    [bookingStats],
    [attendanceStats],
    totalEventViews,
  ] = await Promise.all([
    db.select({
      totalRevenue: sql<string>`coalesce(sum(${payments.amount}), '0')`,
      approvedPaymentsCount: count(),
      avgPayment: sql<string>`coalesce(avg(${payments.amount}), '0')`,
    }).from(payments).where(revenueWhere),
    db.select({ count: count() }).from(payments).where(pendingWhere),
    db.select({ method: payments.method, value: count() }).from(payments).where(paymentMethodsWhere).groupBy(payments.method),
    db.select({ totalCapacity: sql<number>`coalesce(sum(${transportRoutes.totalSeats}), 0)` }).from(transportRoutes).where(transportRoutesWhere),
    db.select({ occupiedSeats: sql<number>`coalesce(sum(${transportBookings.seats}), 0)` }).from(transportBookings).where(transportBookingsWhere),
    db.select({
      checkedInCount: sql<number>`count(case when ${registrations.status} = 'checked_in' then 1 end)`,
      registeredCount: sql<number>`count(case when ${registrations.status} in ('registered', 'checked_in') then 1 end)`,
      waitlistedCount: sql<number>`count(case when ${registrations.status} = 'waitlisted' then 1 end)`,
    }).from(registrations).where(registrationsWhere),
    sumEventViews({ eventScope: eventOrgScope, rangeStart }),
  ]);

  const paymentMethodsStats = rawPaymentMethodsStats.map((item) => {
    let label = item.method;
    if (item.method === "manual") label = "Manual/Transferencia";
    else if (item.method === "yape") label = "Yape";
    else if (item.method === "plin") label = "Plin";
    else if (item.method === "cash") label = "Efectivo";
    else label = item.method.toUpperCase();

    return { name: label, value: Number(item.value) };
  });

  return {
    totalRevenue: Number(revenueResult?.totalRevenue ?? 0),
    approvedPaymentsCount: Number(revenueResult?.approvedPaymentsCount ?? 0),
    avgPayment: Number(revenueResult?.avgPayment ?? 0),
    pendingPaymentsCount: truePendingResult?.count ?? 0,
    paymentMethodsStats,
    totalCapacity: Number(transportStats?.totalCapacity ?? 0),
    occupiedSeats: Number(bookingStats?.occupiedSeats ?? 0),
    checkedInCount: Number(attendanceStats?.checkedInCount ?? 0),
    registeredCount: Number(attendanceStats?.registeredCount ?? 0),
    waitlistedCount: Number(attendanceStats?.waitlistedCount ?? 0),
    totalEventViews,
  };
}
