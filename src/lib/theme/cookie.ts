export const THEME_COOKIE_NAME = "enquiva-theme";
export const THEME_STORAGE_KEY = "theme";

export type AppTheme = "light" | "dark";

export function parseAppTheme(value: string | null | undefined): AppTheme | null {
  if (value === "light" || value === "dark") return value;
  return null;
}

/** Dominio de cookie compartido entre app y docs (p. ej. `.enquiva.site`). */
export function resolveThemeCookieDomain(
  appUrl?: string | null,
  docsUrl?: string | null,
): string | undefined {
  if (!appUrl || !docsUrl) return undefined;
  try {
    const appHost = new URL(appUrl).hostname;
    const docsHost = new URL(docsUrl).hostname;
    if (
      appHost === docsHost ||
      appHost === "localhost" ||
      docsHost === "localhost" ||
      appHost === "127.0.0.1" ||
      docsHost === "127.0.0.1"
    ) {
      return undefined;
    }

    const a = appHost.split(".").reverse();
    const b = docsHost.split(".").reverse();
    const common: string[] = [];
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] !== b[i]) break;
      common.push(a[i]);
    }
    if (common.length < 2) return undefined;
    return `.${common.reverse().join(".")}`;
  } catch {
    return undefined;
  }
}

export function readThemeCookie(
  cookieSource: string = typeof document !== "undefined" ? document.cookie : "",
): AppTheme | null {
  const match = cookieSource.match(
    new RegExp(`(?:^|;\\s*)${THEME_COOKIE_NAME}=([^;]*)`),
  );
  return parseAppTheme(match ? decodeURIComponent(match[1]) : null);
}

export function writeThemeCookie(
  theme: AppTheme,
  domain?: string | null,
): void {
  if (typeof document === "undefined") return;

  const maxAge = 60 * 60 * 24 * 365;
  const parts = [
    `${THEME_COOKIE_NAME}=${encodeURIComponent(theme)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
  ];
  if (domain) parts.push(`Domain=${domain}`);
  if (typeof location !== "undefined" && location.protocol === "https:") {
    parts.push("Secure");
  }
  document.cookie = parts.join("; ");
}
