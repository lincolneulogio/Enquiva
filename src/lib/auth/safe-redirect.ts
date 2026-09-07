/**
 * Resolves post-login redirects safely (open-redirect resistant).
 * Safe for client components: only uses NEXT_PUBLIC_* + static localhost allowlist.
 */
import { getAppBaseUrl } from "@/lib/url";

export function resolveSafeAuthRedirect(
  candidate: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!candidate) return fallback;

  const trimmed = candidate.trim();
  if (!trimmed) return fallback;

  // Same-app relative path only
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const origin = url.origin;

    const allowed = new Set(
      [
        getAppBaseUrl(),
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:4321",
        "http://127.0.0.1:4321",
      ].filter(Boolean) as string[],
    );

    if (allowed.has(origin)) {
      return url.toString();
    }
  } catch {
    /* invalid URL */
  }

  return fallback;
}
