import { cache } from "react";
import { getRequestSession } from "@/lib/request-context";

/**
 * Sesión deduplicada por request para páginas públicas y su header.
 * Comparte la misma caché React que layouts y guards.
 */
export const getPublicSession = cache(async () => getRequestSession());
