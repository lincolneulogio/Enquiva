"use server";

import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { requireSuperAdmin } from "./users";
import { assertAnyPermission } from "@/lib/auth/permission-guards";

export type TaxonomyStats = {
  /** Eventos por slug de categoría. */
  byCategory: Record<string, number>;
  /** Eventos por id de tipo de evento. */
  byType: Record<string, number>;
};

/**
 * Contadores de eventos por categoría y por tipo. Sirve como vista previa de
 * impacto antes de renombrar o desactivar una categoría/tipo.
 */
export async function getTaxonomyStatsAction(): Promise<TaxonomyStats> {
  const user = await requireSuperAdmin();
  await assertAnyPermission(user, ["categories:manage:platform"]);

  const [categoryRows, typeRows] = await Promise.all([
    db
      .select({ slug: events.category, cnt: sql<number>`count(*)::int` })
      .from(events)
      .groupBy(events.category),
    db
      .select({ id: events.eventTypeId, cnt: sql<number>`count(*)::int` })
      .from(events)
      .where(sql`${events.eventTypeId} IS NOT NULL`)
      .groupBy(events.eventTypeId),
  ]);

  const byCategory: Record<string, number> = {};
  for (const row of categoryRows) byCategory[row.slug] = row.cnt;

  const byType: Record<string, number> = {};
  for (const row of typeRows) {
    if (row.id) byType[row.id] = row.cnt;
  }

  return { byCategory, byType };
}