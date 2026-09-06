import { invalidateCachePattern } from "@/lib/redis";

/**
 * Descarta el caché de catálogo y detalle de eventos tras mutar la taxonomía.
 * Las entradas cacheadas (públicas, destacadas y por slug) conservan etiquetas
 * y slugs de categoría/tipo; sin esta invalidación un renombre seguiría
 * mostrando datos viejos hasta que expire el TTL.
 */
export async function invalidateTaxonomyCache() {
  await invalidateCachePattern("events:*");
}