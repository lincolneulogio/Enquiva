import { db } from "@/lib/db";
import { events, payments, registrations, users } from "@/lib/db/schema";
import { and, count, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { andWithScope } from "@/lib/organizations/admin-scope";
import {
  computePercentChange,
  getComparisonWindows,
  type StatsComparison,
} from "@/lib/analytics/comparison";

interface PeriodComparisonsOptions {
  windows: ReturnType<typeof getComparisonWindows>;
  organizerOnly: boolean;
  eventOrgScope?: SQL;
  registrationOrgScope?: SQL;
  userOrgScope?: SQL;
  paymentOrgScope?: SQL;
}

export async function calculatePeriodComparisons({
  windows,
  organizerOnly,
  eventOrgScope,
  registrationOrgScope,
  userOrgScope,
  paymentOrgScope,
}: PeriodComparisonsOptions): Promise<StatsComparison> {
  const compCurrentEventWhere = andWithScope(
    [gte(events.createdAt, windows.currentStart), lte(events.createdAt, windows.currentEnd)],
    eventOrgScope,
  );
  const compCurrentRegWhere = andWithScope(
    [gte(registrations.registeredAt, windows.currentStart), lte(registrations.registeredAt, windows.currentEnd)],
    registrationOrgScope,
  );
  const compCurrentUserWhere = organizerOnly || !userOrgScope
    ? undefined
    : and(gte(users.createdAt, windows.currentStart), lte(users.createdAt, windows.currentEnd), userOrgScope);
  const compCurrentRevenueWhere = andWithScope(
    [eq(payments.status, "approved"), gte(payments.createdAt, windows.currentStart), lte(payments.createdAt, windows.currentEnd)],
    paymentOrgScope,
  );

  const prevEventWhere = andWithScope(
    [gte(events.createdAt, windows.previousStart), lte(events.createdAt, windows.previousEnd)],
    eventOrgScope,
  );
  const prevRegWhere = andWithScope(
    [gte(registrations.registeredAt, windows.previousStart), lte(registrations.registeredAt, windows.previousEnd)],
    registrationOrgScope,
  );
  const prevUserWhere = organizerOnly || !userOrgScope
    ? undefined
    : and(gte(users.createdAt, windows.previousStart), lte(users.createdAt, windows.previousEnd), userOrgScope);
  const prevRevenueWhere = andWithScope(
    [eq(payments.status, "approved"), gte(payments.createdAt, windows.previousStart), lte(payments.createdAt, windows.previousEnd)],
    paymentOrgScope,
  );

  const [
    [compUsers],
    [compEvents],
    [compRegistrations],
    [compRevenue],
    [prevUsers],
    [prevEvents],
    [prevRegistrations],
    [prevRevenue],
  ] = await Promise.all([
    compCurrentUserWhere ? db.select({ count: count() }).from(users).where(compCurrentUserWhere) : Promise.resolve([{ count: 0 }]),
    compCurrentEventWhere ? db.select({ count: count() }).from(events).where(compCurrentEventWhere) : db.select({ count: count() }).from(events),
    compCurrentRegWhere ? db.select({ count: count() }).from(registrations).where(compCurrentRegWhere) : db.select({ count: count() }).from(registrations),
    db.select({ total: sql<string>`coalesce(sum(${payments.amount}), '0')` }).from(payments).where(compCurrentRevenueWhere),
    prevUserWhere ? db.select({ count: count() }).from(users).where(prevUserWhere) : Promise.resolve([{ count: 0 }]),
    prevEventWhere ? db.select({ count: count() }).from(events).where(prevEventWhere) : db.select({ count: count() }).from(events),
    prevRegWhere ? db.select({ count: count() }).from(registrations).where(prevRegWhere) : db.select({ count: count() }).from(registrations),
    db.select({ total: sql<string>`coalesce(sum(${payments.amount}), '0')` }).from(payments).where(prevRevenueWhere),
  ]);

  return {
    totalUsers: organizerOnly ? null : computePercentChange(compUsers?.count ?? 0, prevUsers?.count ?? 0),
    totalEvents: computePercentChange(compEvents?.count ?? 0, prevEvents?.count ?? 0),
    totalRegistrations: computePercentChange(compRegistrations?.count ?? 0, prevRegistrations?.count ?? 0),
    totalRevenue: computePercentChange(Number(compRevenue?.total ?? 0), Number(prevRevenue?.total ?? 0)),
    periodLabelKey: windows.periodLabelKey,
  };
}
