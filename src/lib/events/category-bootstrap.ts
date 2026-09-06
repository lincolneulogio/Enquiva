import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { EVENT_CATEGORIES } from "@/lib/events/taxonomy";
import { isNull } from "drizzle-orm";

/**
 * Asegura que todas las 18 categorías por defecto de la taxonomía de Enquiva
 * existan en la base de datos a nivel de plataforma (organizationId = null).
 */
export async function ensureDefaultPlatformCategories(options?: { fillMissing?: boolean }): Promise<{
  inserted: number;
  total: number;
}> {
  try {
    const existing = await db
      .select({ slug: categories.slug })
      .from(categories)
      .where(isNull(categories.organizationId));

    const existingSlugs = new Set(existing.map((c) => c.slug));
    // En uso normal solo inicializamos una instalación vacía. Así, renombrar una
    // categoría no hace que el slug anterior reaparezca automáticamente.
    const missing = existing.length === 0 || options?.fillMissing
      ? EVENT_CATEGORIES.filter((c) => !existingSlugs.has(c.slug))
      : [];

    if (missing.length > 0) {
      await db
        .insert(categories)
        .values(
          missing.map((cat) => ({
            organizationId: null,
            slug: cat.slug,
            label: cat.labelEs,
            labelEn: cat.labelEn,
            description: cat.description,
            colorClass: cat.colorClass,
            isActive: true,
            sortOrder: cat.sortOrder,
          })),
        )
        .onConflictDoNothing();
    }

    return {
      inserted: missing.length,
      total: existing.length + missing.length,
    };
  } catch (error) {
    console.error("Error al asegurar categorías de plataforma por defecto:", error);
    return { inserted: 0, total: 0 };
  }
}
