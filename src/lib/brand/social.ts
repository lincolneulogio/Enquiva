/** Normaliza URLs de redes: añade https:// si falta. Vacío → "". */
export function normalizeHttpUrl(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (/^\/\//.test(value)) return `https:${value}`;
  return `https://${value}`;
}

/**
 * URL legal: ruta interna (`/terms`) o URL absoluta.
 * Vacío → "".
 */
export function normalizeLegalUrl(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return "";
  if (value.startsWith("/")) {
    // Solo path relativo seguro (sin scheme ni //…).
    if (value.startsWith("//") || value.includes("://")) return "";
    return value.split(/[?#]/)[0] || "/";
  }
  return normalizeHttpUrl(value);
}

/** WhatsApp: URL completa, wa.me, o número (ej. +51999… / 51999…). */
export function normalizeWhatsAppLink(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value) || value.startsWith("wa.me/")) {
    return normalizeHttpUrl(value);
  }
  const digits = value.replace(/[^\d]/g, "");
  if (digits.length >= 8) {
    return `https://wa.me/${digits}`;
  }
  return normalizeHttpUrl(value);
}

export function displaySocialLabel(url: string): string {
  try {
    const u = new URL(normalizeHttpUrl(url));
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname.replace(/\/$/, "");
    if (!path || path === "/") return host;
    return `${host}${path.length > 28 ? `${path.slice(0, 28)}…` : path}`;
  } catch {
    return url;
  }
}
