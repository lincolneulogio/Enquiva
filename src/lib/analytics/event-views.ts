import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq, sql, and, gte, lte, type SQL } from "drizzle-orm";
import { andWithScope } from "@/lib/organizations/admin-scope";

export async function incrementEventViewCount(eventId: string) {
  await db
    .update(events)
    .set({
      viewCount: sql`${events.viewCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId));
}

export async function sumEventViews(options: {
  eventScope?: SQL;
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
}) {
  const dateConditions: SQL[] = [];
  if (options.rangeStart) dateConditions.push(gte(events.createdAt, options.rangeStart));
  if (options.rangeEnd) dateConditions.push(lte(events.createdAt, options.rangeEnd));

  const where = andWithScope(dateConditions, options.eventScope);

  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${events.viewCount}), 0)`,
    })
    .from(events)
    .where(where);

  return Number(row?.total ?? 0);
}
