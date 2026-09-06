import { db } from "@/lib/db";
import { events, registrations, users } from "@/lib/db/schema";
import { count, eq, gte } from "drizzle-orm";
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
import { getCached, setCached, invalidateCachePattern, CACHE_KEYS, CACHE_TTL } from "@/lib/redis";
import { getComparisonWindows } from "@/lib/analytics/comparison";
import {
  buildLastMonthsKeys,
  buildStatsCacheKey,
  getMonthsForRange,
  getRangeStartDate,
  type AdminDashboardStatsOptions,
} from "./types";
import { queryMonthlyActivityAndCategories } from "./monthly-activity";
import { queryFinancialAndTransportStats } from "./financial-transport";
import { calculatePeriodComparisons } from "./comparisons";

export async function invalidateAdminDashboardStatsCache(): Promise<void> {
  await invalidateCachePattern("admin:stats:*");
}

export type AdminDashboardStatsResult = Awaited<ReturnType<typeof computeAdminDashboardStats>>;

export async function getAdminDashboardStats(options?: AdminDashboardStatsOptions): Promise<AdminDashboardStatsResult> {
  const cacheKey = buildStatsCacheKey(options);
  if (!options?.skipCache) {
    const cached = await getCached<AdminDashboardStatsResult>(
      CACHE_KEYS.adminDashboardStats(cacheKey),
    );
    if (cached) {
      return {
        ...cached,
        superAdminCount: typeof cached.superAdminCount === "number" ? cached.superAdminCount : 0,
        adminCount: typeof cached.adminCount === "number" ? cached.adminCount : 0,
        organizerCount: typeof cached.organizerCount === "number" ? cached.organizerCount : 0,
        memberCount: typeof cached.memberCount === "number" ? cached.memberCount : 0,
        scannerCount: typeof cached.scannerCount === "number" ? cached.scannerCount : 0,
      };
    }
  }

  const result = await computeAdminDashboardStats(options);
  await setCached(CACHE_KEYS.adminDashboardStats(cacheKey), result, CACHE_TTL.adminDashboardStats);
  return result;
}

export async function computeAdminDashboardStats(options?: AdminDashboardStatsOptions) {
  const range = options?.range ?? "all";
  const organizationId = options?.organizationId ?? null;
  const organizerId = options?.organizerId ?? null;
  const rangeStart = getRangeStartDate(range);
  const lastMonths = buildLastMonthsKeys(getMonthsForRange(range));
  const organizerOnly = Boolean(organizerId) && !organizationId;

  const eventOrgScope = organizationId
    ? eq(events.organizationId, organizationId)
    : organizerId ? eq(events.organizerId, organizerId) : undefined;
  const userOrgScope = organizationId ? eq(users.organizationId, organizationId) : undefined;
  const registrationOrgScope = organizationId
    ? registrationInOrgCondition(organizationId)
    : organizerId ? registrationForOrganizerCondition(organizerId) : undefined;
  const paymentOrgScope = organizationId
    ? paymentInOrgCondition(organizationId)
    : organizerId ? paymentForOrganizerCondition(organizerId) : undefined;
  const transportRouteOrgScope = organizationId
    ? transportRouteInOrgCondition(organizationId)
    : organizerId ? transportRouteForOrganizerCondition(organizerId) : undefined;
  const transportBookingOrgScope = organizationId
    ? transportBookingInOrgCondition(organizationId)
    : organizerId ? transportBookingForOrganizerCondition(organizerId) : undefined;

  const eventConditions = rangeStart ? [gte(events.createdAt, rangeStart)] : [];
  const registrationConditions = rangeStart ? [gte(registrations.registeredAt, rangeStart)] : [];
  const userConditions = rangeStart ? [gte(users.createdAt, rangeStart)] : [];

  const eventsWhere = andWithScope(eventConditions, eventOrgScope);
  const registrationsWhere = andWithScope(registrationConditions, registrationOrgScope);
  const usersWhere = andWithScope(userConditions, userOrgScope);

  const publishedWhere = andWithScope(rangeStart ? [gte(events.createdAt, rangeStart)] : [], eq(events.status, "published"), eventOrgScope);
  const draftWhere = andWithScope(rangeStart ? [gte(events.createdAt, rangeStart)] : [], eq(events.status, "draft"), eventOrgScope);
  const cancelledWhere = andWithScope(rangeStart ? [gte(events.createdAt, rangeStart)] : [], eq(events.status, "cancelled"), eventOrgScope);

  const superAdminsWhere = organizerOnly ? undefined : andWithScope(rangeStart ? [gte(users.createdAt, rangeStart)] : [], eq(users.role, "super_admin"), userOrgScope);
  const adminsWhere = organizerOnly ? undefined : andWithScope(rangeStart ? [gte(users.createdAt, rangeStart)] : [], eq(users.role, "admin"), userOrgScope);
  const organizersWhere = organizerOnly ? undefined : andWithScope(rangeStart ? [gte(users.createdAt, rangeStart)] : [], eq(users.role, "organizer"), userOrgScope);
  const membersWhere = organizerOnly ? undefined : andWithScope(rangeStart ? [gte(users.createdAt, rangeStart)] : [], eq(users.role, "member"), userOrgScope);
  const scannersWhere = organizerOnly ? undefined : andWithScope(rangeStart ? [gte(users.createdAt, rangeStart)] : [], eq(users.role, "scanner"), userOrgScope);

  const [
    totalUsers, totalEvents, totalRegistrations,
    publishedEvents, draftEvents, cancelledEvents,
    superAdminCount, adminCount, organizerCount, memberCount, scannerCount,
    { monthlyActivity, categoryData },
    financialTransport,
    comparisons,
  ] = await Promise.all([
    organizerOnly ? Promise.resolve([{ count: 0 }]) : usersWhere ? db.select({ count: count() }).from(users).where(usersWhere) : db.select({ count: count() }).from(users),
    eventsWhere ? db.select({ count: count() }).from(events).where(eventsWhere) : db.select({ count: count() }).from(events),
    registrationsWhere ? db.select({ count: count() }).from(registrations).where(registrationsWhere) : db.select({ count: count() }).from(registrations),
    db.select({ count: count() }).from(events).where(publishedWhere),
    db.select({ count: count() }).from(events).where(draftWhere),
    db.select({ count: count() }).from(events).where(cancelledWhere),
    superAdminsWhere ? db.select({ count: count() }).from(users).where(superAdminsWhere) : Promise.resolve([{ count: 0 }]),
    adminsWhere ? db.select({ count: count() }).from(users).where(adminsWhere) : Promise.resolve([{ count: 0 }]),
    organizersWhere ? db.select({ count: count() }).from(users).where(organizersWhere) : Promise.resolve([{ count: 0 }]),
    membersWhere ? db.select({ count: count() }).from(users).where(membersWhere) : Promise.resolve([{ count: 0 }]),
    scannersWhere ? db.select({ count: count() }).from(users).where(scannersWhere) : Promise.resolve([{ count: 0 }]),
    queryMonthlyActivityAndCategories({ eventsWhere, registrationsWhere, usersWhere, organizerOnly, lastMonths }),
    queryFinancialAndTransportStats({ rangeStart, paymentOrgScope, transportRouteOrgScope, transportBookingOrgScope, registrationsWhere, eventOrgScope }),
    calculatePeriodComparisons({ windows: getComparisonWindows(range), organizerOnly, eventOrgScope, registrationOrgScope, userOrgScope, paymentOrgScope }),
  ]);

  return {
    range,
    rangeStart,
    totalUsers: totalUsers[0]?.count ?? 0,
    totalEvents: totalEvents[0]?.count ?? 0,
    totalRegistrations: totalRegistrations[0]?.count ?? 0,
    publishedEvents: publishedEvents[0]?.count ?? 0,
    draftEvents: draftEvents[0]?.count ?? 0,
    cancelledEvents: cancelledEvents[0]?.count ?? 0,
    superAdminCount: superAdminCount[0]?.count ?? 0,
    adminCount: adminCount[0]?.count ?? 0,
    organizerCount: organizerCount[0]?.count ?? 0,
    memberCount: memberCount[0]?.count ?? 0,
    scannerCount: scannerCount[0]?.count ?? 0,
    monthlyActivity,
    categoryData,
    ...financialTransport,
    comparisons,
  };
}
