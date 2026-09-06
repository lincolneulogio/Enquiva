import { db } from "@/lib/db";
import { events, users, registrations } from "@/lib/db/schema";
import { count, sql, desc, type SQL } from "drizzle-orm";
import {
  formatCategoryLabel,
  type CategoryPoint,
  type MonthlyActivityPoint,
} from "./types";

interface QueryActivityOptions {
  eventsWhere?: SQL;
  registrationsWhere?: SQL;
  usersWhere?: SQL;
  organizerOnly: boolean;
  lastMonths: { key: string; label: string }[];
}

export async function queryMonthlyActivityAndCategories({
  eventsWhere,
  registrationsWhere,
  usersWhere,
  organizerOnly,
  lastMonths,
}: QueryActivityOptions): Promise<{
  monthlyActivity: MonthlyActivityPoint[];
  categoryData: CategoryPoint[];
}> {
  const eventMonthExpr = sql<string>`to_char(date_trunc('month', ${events.createdAt}), 'YYYY-MM')`;
  const regMonthExpr = sql<string>`to_char(date_trunc('month', ${registrations.registeredAt}), 'YYYY-MM')`;
  const userMonthExpr = sql<string>`to_char(date_trunc('month', ${users.createdAt}), 'YYYY-MM')`;

  const usersByMonthQuery = organizerOnly
    ? null
    : usersWhere
      ? db.select({ month: userMonthExpr, value: count() }).from(users).where(usersWhere)
      : db.select({ month: userMonthExpr, value: count() }).from(users);

  const [eventsByMonth, registrationsByMonth, usersByMonth, categoriesBreakdown] = await Promise.all([
    (eventsWhere
      ? db.select({ month: eventMonthExpr, value: count() }).from(events).where(eventsWhere)
      : db.select({ month: eventMonthExpr, value: count() }).from(events)
    )
      .groupBy(sql`date_trunc('month', ${events.createdAt})`)
      .orderBy(sql`date_trunc('month', ${events.createdAt})`),
    (registrationsWhere
      ? db.select({ month: regMonthExpr, value: count() }).from(registrations).where(registrationsWhere)
      : db.select({ month: regMonthExpr, value: count() }).from(registrations)
    )
      .groupBy(sql`date_trunc('month', ${registrations.registeredAt})`)
      .orderBy(sql`date_trunc('month', ${registrations.registeredAt})`),
    usersByMonthQuery
      ? usersByMonthQuery
          .groupBy(sql`date_trunc('month', ${users.createdAt})`)
          .orderBy(sql`date_trunc('month', ${users.createdAt})`)
      : Promise.resolve([] as { month: string; value: number }[]),
    (eventsWhere
      ? db.select({ name: events.category, value: count() }).from(events).where(eventsWhere)
      : db.select({ name: events.category, value: count() }).from(events)
    )
      .groupBy(events.category)
      .orderBy(desc(count()))
      .limit(6),
  ]);

  const eventsByMonthMap = new Map(eventsByMonth.map((item) => [item.month, Number(item.value)]));
  const registrationsByMonthMap = new Map(registrationsByMonth.map((item) => [item.month, Number(item.value)]));
  const usersByMonthMap = new Map(usersByMonth.map((item) => [item.month, Number(item.value)]));

  const monthlyActivity: MonthlyActivityPoint[] = lastMonths.map(({ key, label }) => ({
    month: label,
    events: eventsByMonthMap.get(key) ?? 0,
    registrations: registrationsByMonthMap.get(key) ?? 0,
    users: usersByMonthMap.get(key) ?? 0,
  }));

  const categoryData: CategoryPoint[] = categoriesBreakdown.map((item) => ({
    name: formatCategoryLabel(item.name || "other"),
    value: Number(item.value),
  }));

  return { monthlyActivity, categoryData };
}
