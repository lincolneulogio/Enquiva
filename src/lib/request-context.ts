import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSystemSettings } from "@/lib/settings";

/**
 * Datos compartidos por Server Components durante una misma request.
 * React limpia estas memorias al terminar el render, por lo que no mezclan usuarios.
 */
export const getRequestHeaders = cache(async () => headers());

export const getRequestSession = cache(async () =>
  auth.api.getSession({ headers: await getRequestHeaders() }),
);

export const getRequestPathname = cache(async () => {
  const requestHeaders = await getRequestHeaders();
  return requestHeaders.get("x-pathname") ?? "";
});

export const getRequestSystemSettings = cache(async () => getSystemSettings());
