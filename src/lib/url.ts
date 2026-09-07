const DEFAULT_APP_URL = "http://localhost:3000";

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * URL base absoluta y canonical de la app (sin barra final).
 * Orden de precedencia: NEXT_PUBLIC_APP_URL → origin del navegador → localhost.
 */
export function getAppBaseUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
  if (configured) return trimTrailingSlashes(configured);
  if (typeof window !== "undefined") return trimTrailingSlashes(window.location.origin);
  return DEFAULT_APP_URL;
}

/**
 * Arma una URL absoluta para una ruta de la misma app.
 * `path` opcional: sin él devuelve la base canónica.
 */
export function absoluteUrl(path = ""): string {
  const base = getAppBaseUrl();
  if (!path) return base;
  return `${base}/${path.replace(/^\/+/, "")}`;
}