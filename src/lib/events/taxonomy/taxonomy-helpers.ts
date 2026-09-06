import type { EventCategoryDefinition, EventTypeOption } from "./types";
import { EVENT_CATEGORIES_PART1 } from "./categories-part1";
import { EVENT_CATEGORIES_PART2 } from "./categories-part2";
import { EVENT_CATEGORIES_PART3 } from "./categories-part3";

export const EVENT_CATEGORIES: readonly EventCategoryDefinition[] = [
  ...EVENT_CATEGORIES_PART1,
  ...EVENT_CATEGORIES_PART2,
  ...EVENT_CATEGORIES_PART3,
] as const;

/** Mapa de categorías por slug canonical */
export const CATEGORIES_BY_SLUG: Readonly<Record<string, EventCategoryDefinition>> =
  Object.freeze(
    EVENT_CATEGORIES.reduce<Record<string, EventCategoryDefinition>>((acc, cat) => {
      acc[cat.slug] = cat;
      return acc;
    }, {})
  );

/**
 * Mapeo de categorías legadas hacia las nuevas categorías canónicas
 * para compatibilidad total de eventos existentes en base de datos.
 */
export const LEGACY_CATEGORY_MAP: Readonly<Record<string, string>> = Object.freeze({
  worship: "religion",
  retreat: "religion",
  youth: "family",
  prayer: "religion",
  bible_study: "education",
  outreach: "community",
  fellowship: "community",
  conference: "conferences",
  charity: "charity",
  other: "other",
});

/** Normaliza cualquier slug o código de categoría a su versión canónica. */
export function canonicalCategorySlug(slug: string | null | undefined): string {
  if (!slug) return "other";
  const clean = slug.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (CATEGORIES_BY_SLUG[clean]) return clean;
  if (LEGACY_CATEGORY_MAP[clean]) return LEGACY_CATEGORY_MAP[clean]!;
  return clean;
}

/** Obtiene la definición completa de una categoría por slug. */
export function getCategoryDefinition(slug: string | null | undefined): EventCategoryDefinition | undefined {
  if (!slug) return undefined;
  const canonical = canonicalCategorySlug(slug);
  return CATEGORIES_BY_SLUG[canonical];
}

/** Obtiene la lista de tipos / subtipos disponibles para una categoría. */
export function getTypesForCategory(categorySlug: string | null | undefined): EventTypeOption[] {
  if (!categorySlug) {
    return [
      { slug: "conferencia", label: "Conferencia" },
      { slug: "taller", label: "Taller" },
      { slug: "curso", label: "Curso" },
      { slug: "concierto", label: "Concierto" },
      { slug: "networking", label: "Networking" },
      { slug: "torneo", label: "Torneo" },
      { slug: "feria", label: "Feria" },
      { slug: "festival", label: "Festival" },
      { slug: "webinar", label: "Webinar" },
      { slug: "masterclass", label: "Masterclass" },
      { slug: "hackathon", label: "Hackathon" },
      { slug: "reunion", label: "Reunión" },
    ];
  }
  const def = getCategoryDefinition(categorySlug);
  return def ? [...def.types] : [];
}

/** Lista de categorías destacadas (primeras para mostrar en pills rápidas). */
export const FEATURED_CATEGORY_SLUGS: readonly string[] = [
  "conferences",
  "education",
  "business",
  "music",
  "sports",
  "religion",
  "arts",
  "technology",
] as const;

/** Opciones de modalidad tipadas. */
export const MODALITY_OPTIONS = [
  { value: "all", labelEs: "Todas", labelEn: "All" },
  { value: "in_person", labelEs: "Presencial", labelEn: "In person" },
  { value: "online", labelEs: "Online", labelEn: "Online" },
  { value: "hybrid", labelEs: "Híbrido", labelEn: "Hybrid" },
] as const;

/** Opciones de filtro de fecha tipadas. */
export const DATE_FILTER_OPTIONS = [
  { value: "all", labelEs: "Cualquier fecha", labelEn: "Any date" },
  { value: "today", labelEs: "Hoy", labelEn: "Today" },
  { value: "tomorrow", labelEs: "Mañana", labelEn: "Tomorrow" },
  { value: "this_week", labelEs: "Esta semana", labelEn: "This week" },
  { value: "this_month", labelEs: "Este mes", labelEn: "This month" },
  { value: "upcoming", labelEs: "Próximamente", labelEn: "Upcoming" },
  { value: "past", labelEs: "Finalizados", labelEn: "Past events" },
] as const;

/** Opciones de filtro de precio tipadas. */
export const PRICE_FILTER_OPTIONS = [
  { value: "all", labelEs: "Todos", labelEn: "All" },
  { value: "free", labelEs: "Gratis", labelEn: "Free" },
  { value: "paid", labelEs: "De pago", labelEn: "Paid" },
] as const;

/** Opciones de tipo de acceso tipadas. */
export const ACCESS_TYPE_OPTIONS = [
  { value: "all", labelEs: "Todos", labelEn: "All" },
  { value: "free", labelEs: "Entrada gratuita", labelEn: "Free entry" },
  { value: "paid", labelEs: "Entrada de pago", labelEn: "Paid ticket" },
  { value: "registration", labelEs: "Registro", labelEn: "Registration" },
  { value: "invitation", labelEs: "Invitación", labelEn: "Invitation" },
] as const;

/** Opciones de estado tipadas. */
export const STATUS_FILTER_OPTIONS = [
  { value: "all", labelEs: "Todos", labelEn: "All" },
  { value: "upcoming", labelEs: "Próximos", labelEn: "Upcoming" },
  { value: "ongoing", labelEs: "En curso", labelEn: "Ongoing" },
  { value: "completed", labelEs: "Finalizados", labelEn: "Completed" },
] as const;
