import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Sesión deduplicada por request para páginas públicas y su header.
 * Evita repetir la misma consulta de Better Auth durante un render SSR.
 */
export const getPublicSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});
