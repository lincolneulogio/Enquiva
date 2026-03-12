import { db } from "@/lib/db";
import { events, users, registrations } from "@/lib/db/schema";
import { count, eq, sql, desc, and, gte } from "drizzle-orm";

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

export async function getAdminDashboardStats(options?: { range?: AdminStatsRange }) {
    const range = options?.range ?? "all";
    const rangeStart = getRangeStartDate(range);
    const lastMonths = buildLastMonthsKeys(getMonthsForRange(range));
    const eventMonthExpr = sql<string>`to_char(date_trunc('month', ${events.createdAt}), 'YYYY-MM')`;
    const regMonthExpr = sql<string>`to_char(date_trunc('month', ${registrations.registeredAt}), 'YYYY-MM')`;

    const eventConditions = rangeStart ? [gte(events.createdAt, rangeStart)] : [];
    const registrationConditions = rangeStart ? [gte(registrations.registeredAt, rangeStart)] : [];
    const userConditions = rangeStart ? [gte(users.createdAt, rangeStart)] : [];

    const eventsWhere = eventConditions.length ? and(...eventConditions) : undefined;
    const registrationsWhere = registrationConditions.length ? and(...registrationConditions) : undefined;
    const usersWhere = userConditions.length ? and(...userConditions) : undefined;

    const publishedWhere = eventConditions.length
        ? and(...eventConditions, eq(events.status, "published"))
        : eq(events.status, "published");
    const draftWhere = eventConditions.length
        ? and(...eventConditions, eq(events.status, "draft"))
        : eq(events.status, "draft");
    const cancelledWhere = eventConditions.length
        ? and(...eventConditions, eq(events.status, "cancelled"))
        : eq(events.status, "cancelled");

    const membersWhere = userConditions.length
        ? and(...userConditions, eq(users.role, "member"))
        : eq(users.role, "member");
    const organizersWhere = userConditions.length
        ? and(...userConditions, eq(users.role, "organizer"))
        : eq(users.role, "organizer");

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
        usersWhere
            ? db.select({ count: count() }).from(users).where(usersWhere)
            : db.select({ count: count() }).from(users),
        eventsWhere
            ? db.select({ count: count() }).from(events).where(eventsWhere)
            : db.select({ count: count() }).from(events),
        registrationsWhere
            ? db.select({ count: count() }).from(registrations).where(registrationsWhere)
            : db.select({ count: count() }).from(registrations),
        db.select({ count: count() }).from(events).where(publishedWhere),
        db.select({ count: count() }).from(events).where(draftWhere),
        db.select({ count: count() }).from(events).where(cancelledWhere),
        db.select({ count: count() }).from(users).where(membersWhere),
        db.select({ count: count() }).from(users).where(organizersWhere),
    ]);

    const [eventsByMonth, registrationsByMonth, categoriesBreakdown] = await Promise.all([
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
                .from(events))
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
                .from(registrations))
            .groupBy(sql`date_trunc('month', ${registrations.registeredAt})`)
            .orderBy(sql`date_trunc('month', ${registrations.registeredAt})`),
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
                .from(events))
            .groupBy(events.category)
            .orderBy(desc(count()))
            .limit(6),
    ]);

    const eventsByMonthMap = new Map(
        eventsByMonth.map((item) => [item.month, Number(item.value)])
    );
    const registrationsByMonthMap = new Map(
        registrationsByMonth.map((item) => [item.month, Number(item.value)])
    );

    const monthlyActivity: MonthlyActivityPoint[] = lastMonths.map(({ key, label }) => ({
        month: label,
        events: eventsByMonthMap.get(key) ?? 0,
        registrations: registrationsByMonthMap.get(key) ?? 0,
    }));

    const categoryData: CategoryPoint[] = categoriesBreakdown.map((item) => ({
        name: formatCategoryLabel(item.name || "other"),
        value: Number(item.value),
    }));

    return {
        range,
        rangeStart,
        totalUsers: totalUsers[0]?.count ?? 0,
        totalEvents: totalEvents[0]?.count ?? 0,
        totalRegistrations: totalRegistrations[0]?.count ?? 0,
        publishedEvents: publishedEvents[0]?.count ?? 0,
        draftEvents: draftEvents[0]?.count ?? 0,
        cancelledEvents: cancelledEvents[0]?.count ?? 0,
        memberCount: memberCount[0]?.count ?? 0,
        organizerCount: organizerCount[0]?.count ?? 0,
        monthlyActivity,
        categoryData,
    };
}
