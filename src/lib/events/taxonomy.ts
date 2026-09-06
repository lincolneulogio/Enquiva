/**
 * Taxonomía de eventos de Enquiva.
 * Re-exports from modularized sub-modules in @/lib/events/taxonomy/
 */
export type {
  EventTypeOption,
  EventCategoryDefinition,
  EventModality,
  EventDateFilter,
  EventPriceFilter,
  EventAccessFilter,
  EventStatusFilter,
} from "./taxonomy/types";

export {
  EVENT_CATEGORIES,
  CATEGORIES_BY_SLUG,
  LEGACY_CATEGORY_MAP,
  canonicalCategorySlug,
  getCategoryDefinition,
  getTypesForCategory,
  FEATURED_CATEGORY_SLUGS,
  MODALITY_OPTIONS,
  DATE_FILTER_OPTIONS,
  PRICE_FILTER_OPTIONS,
  ACCESS_TYPE_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "./taxonomy/taxonomy-helpers";
