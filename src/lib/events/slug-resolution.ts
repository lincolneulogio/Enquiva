import { db } from "@/lib/db";
import { categories, categorySlugAliases, eventTypes, eventTypeSlugAliases } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { CATEGORIES_BY_SLUG, LEGACY_CATEGORY_MAP } from "./taxonomy";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Verifica si un valor tiene formato UUID v4. */
export function isUUID(v: string): boolean {
  return UUID_RE.test(v);
}

/**
 * Resuelve un slug de categoría (canónico, legado o alias histórico) al slug actual.
 * - Null/empty/"all" → null (sin filtro de categoría).
 * - Taxonomy estándar y legados → canónico estático sin consultar BD.
 * - Slugs de BD (renombrados) → alias → slug actual.
 */
export async function resolveCategoryCurrentSlug(
  input: string | null | undefined,
): Promise<string | null> {
  if (!input || input.trim() === "" || input === "all") return null;

  const key = input.toLowerCase().trim().replace(/[\s-]+/g, "_");

  // 1) Estático: taxonomía canónica o legado conocido
  if (CATEGORIES_BY_SLUG[key]) return key;
  if (LEGACY_CATEGORY_MAP[key]) return LEGACY_CATEGORY_MAP[key]!;

  // 2) BD: slug actual
  const [bySlug] = await db
    .select({ slug: categories.slug })
    .from(categories)
    .where(eq(categories.slug, key))
    .limit(1);
  if (bySlug) return bySlug.slug;

  // 3) Alias histórico
  const [byAlias] = await db
    .select({ currentSlug: categories.slug })
    .from(categorySlugAliases)
    .innerJoin(categories, eq(categorySlugAliases.categoryId, categories.id))
    .where(eq(categorySlugAliases.slug, key))
    .limit(1);

  return byAlias?.currentSlug ?? key;
}

/**
 * Resuelve un valor de tipo (UUID, slug actual o alias) a IDs activos.
 * Si se provee categorySlug, filtra por esa categoría.
 */
export async function resolveEventTypeIds(
  typeValue: string | null | undefined,
  categorySlug?: string | null,
): Promise<string[]> {
  if (!typeValue || typeValue === "all") return [];

  // UUID directo
  if (isUUID(typeValue)) {
    const conds = [eq(eventTypes.isActive, true), eq(eventTypes.id, typeValue)];
    if (categorySlug) conds.push(eq(eventTypes.categorySlug, categorySlug));
    const rows = await db
      .select({ id: eventTypes.id })
      .from(eventTypes)
      .where(and(...conds))
      .limit(1);
    return rows.map((r) => r.id);
  }

  const typeSlug = typeValue.toLowerCase().trim().replace(/[\s-]+/g, "_");

  // Slug actual
  const slugConds = [eq(eventTypes.isActive, true), eq(eventTypes.slug, typeSlug)];
  if (categorySlug) slugConds.push(eq(eventTypes.categorySlug, categorySlug));
  const bySlugPromise = db
    .select({ id: eventTypes.id })
    .from(eventTypes)
    .where(and(...slugConds));

  // Alias histórico
  const aliasConds = [eq(eventTypeSlugAliases.slug, typeSlug)];
  if (categorySlug) aliasConds.push(eq(eventTypeSlugAliases.categorySlug, categorySlug));
  const byAliasPromise = db
    .select({ id: eventTypes.id })
    .from(eventTypeSlugAliases)
    .innerJoin(eventTypes, eq(eventTypeSlugAliases.eventTypeId, eventTypes.id))
    .where(and(...aliasConds));

  const [slugRows, aliasRows] = await Promise.all([bySlugPromise, byAliasPromise]);
  const ids = new Set([...slugRows.map((r) => r.id), ...aliasRows.map((r) => r.id)]);
  return [...ids];
}
