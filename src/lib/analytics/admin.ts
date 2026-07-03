import { db } from "@/lib/db";
import {
  events,
  users,
  registrations,
  payments,
  transportRoutes,
  transportBookings,
} from "@/lib/db/schema";
import { count, eq, sql, desc, and, gte, lte } from "drizzle-orm";
import { createHash } from "crypto";
import {
  registrationInOrgCondition,
  paymentInOrgCondition,
  transportRouteInOrgCondition,
  transportBookingInOrgCondition,
  registrationForOrganizerCondition,
  paymentForOrganizerCondition,
  transportRouteForOrganizerCondition,
  transportBookingForOrganizerCondition,
  andWithScope,
} from "@/lib/organizations/admin-scope";
import { getCached, setCached, CACHE_KEYS, CACHE_TTL } from "@/lib/redis";
import { sumEventViews } from "@/lib/analytics/event-views";
import {
  computePercentChange,
  getComparisonWindows,
  type StatsComparison,
} from "@/lib/analytics/comparison";

export type AdminStatsRange = "30d" | "90d" | "12m" | "all";

const RANGE_TO_DAYS: Record<Exclude<AdminStatsRange, "all">, number> = {
  "30d": 30,
  "90d": 90,
  "12m": 365,
};

export type MonthlyActivityPoint = {
  month: string;
  events: number;
  registrations: number;
  users: number;
};

export type CategoryPoint = {
  name: string;
  value: number;
};

const formatCategoryLabel = (raw: string) =>
  raw
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

function buildLastMonthsKeys(months: number) {
  const now = new Date();
  const keys: { key: string; label: string }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short" });
    keys.push({ key, label });
  }

  return keys;
}

function getRangeStartDate(range: AdminStatsRange) {
  if (range === "all") return null;
  const d = new Date();
  d.setDate(d.getDate() - RANGE_TO_DAYS[range]);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getMonthsForRange(range: AdminStatsRange) {
  if (range === "all") return 6;
  if (range === "30d") return 2;
  if (range === "90d") return 4;
  return 12;
}

export type AdminDashboardStatsResult = Awaited<ReturnType<typeof computeAdminDashboardStats>>;

function buildStatsCacheKey(options?: {
  range?: AdminStatsRange;
  organizationId?: string | null;
  organizerId?: string | null;
}) {
  const raw = JSON.stringify({
    range: options?.range ?? "all",
    organizationId: options?.organizationId ?? "",
    organizerId: options?.organizerId ?? "",
  });
  return createHash("sha256").update(raw).digest("hex").slice(0, 24);
}

export async function getAdminDashboardStats(options?: {
  range?: AdminStatsRange;
  organizationId?: string | null;
  organizerId?: string | null;
  skipCache?: boolean;
}) {
  const cacheKey = buildStatsCacheKey(options);
  if (!options?.skipCache) {
    const cached = await getCached<AdminDashboardStatsResult>(
      CACHE_KEYS.adminDashboardStats(cacheKey),
    );
    if (cached) return cached;
  }

  const result = await computeAdminDashboardStats(options);
  await setCached(CACHE_KEYS.adminDashboardStats(cacheKey), result, CACHE_TTL.adminDashboardStats);
  return result;
}

async function computeAdminDashboardStats(options?: {
  range?: AdminStatsRange;
  organizationId?: string | null;
  organizerId?: string | null;
}) {
  const range = options?.range ?? "all";
  const organizationId = options?.organizationId ?? null;
  const organizerId = options?.organizerId ?? null;
  const rangeStart = getRangeStartDate(range);
  const lastMonths = buildLastMonthsKeys(getMonthsForRange(range));
  const organizerOnly = Boolean(organizerId) && !organizationId;

  const eventOrgScope = organizationId
    ? eq(events.organizationId, organizationId)
    : organizerId
      ? eq(events.organizerId, organizerId)
      : undefined;
  const userOrgScope = organizationId ? eq(users.organizationId, organizationId) : undefined;
  const registrationOrgScope = organizationId
    ? registrationInOrgCondition(organizationId)
    : organizerId
      ? registrationForOrganizerCondition(organizerId)
      : undefined;
  const paymentOrgScope = organizationId
    ? paymentInOrgCondition(organizationId)
    : organizerId
      ? paymentForOrganizerCondition(organizerId)
      : undefined;
  const transportRouteOrgScope = organizationId
    ? transportRouteInOrgCondition(organizationId)
    : organizerId
      ? transportRouteForOrganizerCondition(organizerId)
      : undefined;
  const transportBookingOrgScope = organizationId
    ? transportBookingInOrgCondition(organizationId)
    : organizerId
      ? transportBookingForOrganizerCondition(organizerId)
      : undefined;

  const eventMonthExpr = sql<string>`to_char(date_trunc('month', ${events.createdAt}), 'YYYY-MM')`;
  const regMonthExpr = sql<string>`to_char(date_trunc('month', ${registrations.registeredAt}), 'YYYY-MM')`;
  const userMonthExpr = sql<string>`to_char(date_trunc('month', ${users.createdAt}), 'YYYY-MM')`;

  const eventConditions = rangeStart ? [gte(events.createdAt, rangeStart)] : [];
  const registrationConditions = rangeStart
    ? [gte(registrations.registeredAt, rangeStart)]
    : [];
  const userConditions = rangeStart ? [gte(users.createdAt, rangeStart)] : [];

  const eventsWhere = andWithScope(eventConditions, eventOrgScope);
  const registrationsWhere = andWithScope(registrationConditions, registrationOrgScope);
  const usersWhere = andWithScope(userConditions, userOrgScope);

  const publishedWhere = andWithScope(
    rangeStart ? [gte(events.createdAt, rangeStart)] : [],
    eq(events.status, "published"),
    eventOrgScope,
  );
  const draftWhere = andWithScope(
    rangeStart ? [gte(events.createdAt, rangeStart)] : [],
    eq(events.status, "draft"),
    eventOrgScope,
  );
  const cancelledWhere = andWithScope(
    rangeStart ? [gte(events.createdAt, rangeStart)] : [],
    eq(events.status, "cancelled"),
    eventOrgScope,
  );

  const membersWhere = organizerOnly
    ? undefined
    : andWithScope(
        rangeStart ? [gte(users.createdAt, rangeStart)] : [],
        eq(users.role, "member"),
        userOrgScope,
      );
  const organizersWhere = organizerOnly
    ? undefined
    : andWithScope(
        rangeStart ? [gte(users.createdAt, rangeStart)] : [],
        eq(users.role, "organizer"),
        userOrgScope,
      );

  const [
    totalUsers,
    totalEvents,
    totalRegistrations,
    publishedEvents,
    draftEvents,
    cancelledEvents,
    memberCount,
    organizerCount,
  ] = await Promise.all([
    organizerOnly
      ? Promise.resolve([{ count: 0 }])
      : usersWhere
        ? db.select({ count: count() }).from(users).where(usersWhere)
        : db.select({ count: count() }).from(users),
    eventsWhere
      ? db.select({ count: count() }).from(events).where(eventsWhere)
      : db.select({ count: count() }).from(events),
    registrationsWhere
      ? db
          .select({ count: count() })
          .from(registrations)
          .where(registrationsWhere)
      : db.select({ count: count() }).from(registrations),
    db.select({ count: count() }).from(events).where(publishedWhere),
    db.select({ count: count() }).from(events).where(draftWhere),
    db.select({ count: count() }).from(events).where(cancelledWhere),
    membersWhere
      ? db.select({ count: count() }).from(users).where(membersWhere)
      : Promise.resolve([{ count: 0 }]),
    organizersWhere
      ? db.select({ count: count() }).from(users).where(organizersWhere)
      : Promise.resolve([{ count: 0 }]),
  ]);

  const usersByMonthQuery = organizerOnly
    ? null
    : usersWhere
      ? db
          .select({
            month: userMonthExpr,
            value: count(),
          })
          .from(users)
          .where(usersWhere)
      : db
          .select({
            month: userMonthExpr,
            value: count(),
          })
          .from(users);

  const [
    eventsByMonth,
    registrationsByMonth,
    usersByMonth,
    categoriesBreakdown,
  ] = await Promise.all([
    (eventsWhere
      ? db
          .select({
            month: eventMonthExpr,
            value: count(),
          })
          .from(events)
          .where(eventsWhere)
      : db
          .select({
            month: eventMonthExpr,
            value: count(),
          })
          .from(events)
    )
      .groupBy(sql`date_trunc('month', ${events.createdAt})`)
      .orderBy(sql`date_trunc('month', ${events.createdAt})`),
    (registrationsWhere
      ? db
          .select({
            month: regMonthExpr,
            value: count(),
          })
          .from(registrations)
          .where(registrationsWhere)
      : db
          .select({
            month: regMonthExpr,
            value: count(),
          })
          .from(registrations)
    )
      .groupBy(sql`date_trunc('month', ${registrations.registeredAt})`)
      .orderBy(sql`date_trunc('month', ${registrations.registeredAt})`),
    usersByMonthQuery
      ? usersByMonthQuery
          .groupBy(sql`date_trunc('month', ${users.createdAt})`)
          .orderBy(sql`date_trunc('month', ${users.createdAt})`)
      : Promise.resolve([] as { month: string; value: number }[]),
    (eventsWhere
      ? db
          .select({
            name: events.category,
            value: count(),
          })
          .from(events)
          .where(eventsWhere)
      : db
          .select({
            name: events.category,
            value: count(),
          })
          .from(events)
    )
      .groupBy(events.category)
      .orderBy(desc(count()))
      .limit(6),
  ]);

  const eventsByMonthMap = new Map(
    eventsByMonth.map((item) => [item.month, Number(item.value)]),
  );
  const registrationsByMonthMap = new Map(
    registrationsByMonth.map((item) => [item.month, Number(item.value)]),
  );
  const usersByMonthMap = new Map(
    usersByMonth.map((item) => [item.month, Number(item.value)]),
  );

  const monthlyActivity: MonthlyActivityPoint[] = lastMonths.map(
    ({ key, label }) => ({
      month: label,
      events: eventsByMonthMap.get(key) ?? 0,
      registrations: registrationsByMonthMap.get(key) ?? 0,
      users: usersByMonthMap.get(key) ?? 0,
    }),
  );

  const categoryData: CategoryPoint[] = categoriesBreakdown.map((item) => ({
    name: formatCategoryLabel(item.name || "other"),
    value: Number(item.value),
  }));

  const revenueWhere = andWithScope(
    [eq(payments.status, "approved")],
    rangeStart ? gte(payments.createdAt, rangeStart) : undefined,
    paymentOrgScope,
  );

  const [revenueResult] = await db
    .select({
      totalRevenue: sql<string>`coalesce(sum(${payments.amount}), '0')`,
      approvedPaymentsCount: count(),
      avgPayment: sql<string>`coalesce(avg(${payments.amount}), '0')`,
    })
    .from(payments)
    .where(revenueWhere);

  const pendingWhere = andWithScope([eq(payments.status, "pending")], paymentOrgScope);

  const [truePendingResult] = await db
    .select({
      count: count(),
    })
    .from(payments)
    .where(pendingWhere);

  const paymentMethodsWhere = andWithScope(
    [eq(payments.status, "approved")],
    rangeStart ? gte(payments.createdAt, rangeStart) : undefined,
    paymentOrgScope,
  );

  const rawPaymentMethodsStats = await db
    .select({
      method: payments.method,
      value: count(),
    })
    .from(payments)
    .where(paymentMethodsWhere)
    .groupBy(payments.method);

  const paymentMethodsStats = rawPaymentMethodsStats.map((item) => {
    let label = item.method;
    if (item.method === "manual") label = "Manual/Transferencia";
    else if (item.method === "yape") label = "Yape";
    else if (item.method === "plin") label = "Plin";
    else if (item.method === "cash") label = "Efectivo";
    else label = item.method.toUpperCase();

    return {
      name: label,
      value: Number(item.value),
    };
  });

  const transportRoutesWhere = andWithScope(
    rangeStart ? [gte(transportRoutes.createdAt, rangeStart)] : [],
    transportRouteOrgScope,
  );

  const [transportStats] = await db
    .select({
      totalCapacity: sql<number>`coalesce(sum(${transportRoutes.totalSeats}), 0)`,
    })
    .from(transportRoutes)
    .where(transportRoutesWhere);

  const transportBookingsWhere = andWithScope(
    [eq(transportBookings.status, "confirmed")],
    rangeStart ? gte(transportBookings.bookedAt, rangeStart) : undefined,
    transportBookingOrgScope,
  );

  const [bookingStats] = await db
    .select({
      occupiedSeats: sql<number>`coalesce(sum(${transportBookings.seats}), 0)`,
    })
    .from(transportBookings)
    .where(transportBookingsWhere);

  const [attendanceStats] = await db
    .select({
      checkedInCount: sql<number>`count(case when ${registrations.status} = 'checked_in' then 1 end)`,
      registeredCount: sql<number>`count(case when ${registrations.status} in ('registered', 'checked_in') then 1 end)`,
      waitlistedCount: sql<number>`count(case when ${registrations.status} = 'waitlisted' then 1 end)`,
    })
    .from(registrations)
    .where(registrationsWhere);

  const totalEventViews = await sumEventViews({
    eventScope: eventOrgScope,
    rangeStart,
  });

  const windows = getComparisonWindows(range);

  const compCurrentEventWhere = andWithScope(
    [gte(events.createdAt, windows.currentStart), lte(events.createdAt, windows.currentEnd)],
    eventOrgScope,
  );
  const compCurrentRegWhere = andWithScope(
    [
      gte(registrations.registeredAt, windows.currentStart),
      lte(registrations.registeredAt, windows.currentEnd),
    ],
    registrationOrgScope,
  );
  const compCurrentUserWhere =
    organizerOnly || !userOrgScope
      ? undefined
      : and(
          gte(users.createdAt, windows.currentStart),
          lte(users.createdAt, windows.currentEnd),
          userOrgScope,
        );
  const compCurrentRevenueWhere = andWithScope(
    [
      eq(payments.status, "approved"),
      gte(payments.createdAt, windows.currentStart),
      lte(payments.createdAt, windows.currentEnd),
    ],
    paymentOrgScope,
  );

  const prevEventWhere = andWithScope(
    [gte(events.createdAt, windows.previousStart), lte(events.createdAt, windows.previousEnd)],
    eventOrgScope,
  );
  const prevRegWhere = andWithScope(
    [
      gte(registrations.registeredAt, windows.previousStart),
      lte(registrations.registeredAt, windows.previousEnd),
    ],
    registrationOrgScope,
  );
  const prevUserWhere =
    organizerOnly || !userOrgScope
      ? undefined
      : and(
          gte(users.createdAt, windows.previousStart),
          lte(users.createdAt, windows.previousEnd),
          userOrgScope,
        );
  const prevRevenueWhere = andWithScope(
    [
      eq(payments.status, "approved"),
      gte(payments.createdAt, windows.previousStart),
      lte(payments.createdAt, windows.previousEnd),
    ],
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
    compCurrentUserWhere
      ? db.select({ count: count() }).from(users).where(compCurrentUserWhere)
      : Promise.resolve([{ count: 0 }]),
    compCurrentEventWhere
      ? db.select({ count: count() }).from(events).where(compCurrentEventWhere)
      : db.select({ count: count() }).from(events),
    compCurrentRegWhere
      ? db.select({ count: count() }).from(registrations).where(compCurrentRegWhere)
      : db.select({ count: count() }).from(registrations),
    db
      .select({ total: sql<string>`coalesce(sum(${payments.amount}), '0')` })
      .from(payments)
      .where(compCurrentRevenueWhere),
    prevUserWhere
      ? db.select({ count: count() }).from(users).where(prevUserWhere)
      : Promise.resolve([{ count: 0 }]),
    prevEventWhere
      ? db.select({ count: count() }).from(events).where(prevEventWhere)
      : db.select({ count: count() }).from(events),
    prevRegWhere
      ? db.select({ count: count() }).from(registrations).where(prevRegWhere)
      : db.select({ count: count() }).from(registrations),
    db
      .select({ total: sql<string>`coalesce(sum(${payments.amount}), '0')` })
      .from(payments)
      .where(prevRevenueWhere),
  ]);

  const currentUsers = totalUsers[0]?.count ?? 0;
  const currentEvents = totalEvents[0]?.count ?? 0;
  const currentRegistrations = totalRegistrations[0]?.count ?? 0;
  const currentRevenue = Number(revenueResult?.totalRevenue ?? 0);

  const comparisons: StatsComparison = {
    totalUsers: organizerOnly
      ? null
      : computePercentChange(compUsers?.count ?? 0, prevUsers?.count ?? 0),
    totalEvents: computePercentChange(compEvents?.count ?? 0, prevEvents?.count ?? 0),
    totalRegistrations: computePercentChange(
      compRegistrations?.count ?? 0,
      prevRegistrations?.count ?? 0,
    ),
    totalRevenue: computePercentChange(
      Number(compRevenue?.total ?? 0),
      Number(prevRevenue?.total ?? 0),
    ),
    periodLabelKey: windows.periodLabelKey,
  };

  return {
    range,
    rangeStart,
    totalUsers: currentUsers,
    totalEvents: currentEvents,
    totalRegistrations: currentRegistrations,
    publishedEvents: publishedEvents[0]?.count ?? 0,
    draftEvents: draftEvents[0]?.count ?? 0,
    cancelledEvents: cancelledEvents[0]?.count ?? 0,
    memberCount: memberCount[0]?.count ?? 0,
    organizerCount: organizerCount[0]?.count ?? 0,
    monthlyActivity,
    categoryData,
    totalRevenue: currentRevenue,
    pendingPaymentsCount: truePendingResult?.count ?? 0,
    avgPayment: Number(revenueResult?.avgPayment ?? 0),
    paymentMethodsStats,
    totalCapacity: Number(transportStats?.totalCapacity ?? 0),
    occupiedSeats: Number(bookingStats?.occupiedSeats ?? 0),
    checkedInCount: Number(attendanceStats?.checkedInCount ?? 0),
    registeredCount: Number(attendanceStats?.registeredCount ?? 0),
    waitlistedCount: Number(attendanceStats?.waitlistedCount ?? 0),
    approvedPaymentsCount: Number(revenueResult?.approvedPaymentsCount ?? 0),
    totalEventViews,
    comparisons,
  };
}
