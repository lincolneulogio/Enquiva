"use server";

import { db } from "@/lib/db";
import { eventTypes } from "@/lib/db/schema";
import { EVENT_CATEGORIES } from "@/lib/events/taxonomy";
import { eq, and } from "drizzle-orm";

/**
 * Semilla de tipos de evento predeterminados desde los arrays estáticos de taxonomía.
 * Solo inserta los que no existan aún (idempotente).
 * Se llama al arrancar el panel superadmin y al ejecutar la sincronización.
 */
export async function ensureDefaultEventTypes(): Promise<{
  inserted: number;
  total: number;
}> {
  // Recopila todos los tipos de todas las categorías
  const allTypes: Array<{ categorySlug: string; slug: string; label: string; sortOrder: number }> = [];

  for (const cat of EVENT_CATEGORIES) {
    cat.types.forEach((type, idx) => {
      allTypes.push({
        categorySlug: cat.slug,
        slug: type.slug,
        label: type.label,
        sortOrder: idx,
      });
    });
  }

  let inserted = 0;

  for (const type of allTypes) {
    const [existing] = await db
      .select({ id: eventTypes.id })
      .from(eventTypes)
      .where(
        and(
          eq(eventTypes.categorySlug, type.categorySlug),
          eq(eventTypes.slug, type.slug),
        ),
      )
      .limit(1);

    if (!existing) {
      await db.insert(eventTypes).values({
        categorySlug: type.categorySlug,
        slug: type.slug,
        label: type.label,
        sortOrder: type.sortOrder,
        isActive: true,
      });
      inserted++;
    }
  }

  return { inserted, total: allTypes.length };
}
