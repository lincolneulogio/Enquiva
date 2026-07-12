import crypto from "crypto";

export type CulqiWebhookAuthResult =
  | { ok: true; mode: "hmac" | "legacy-header" | "query-token" }
  | { ok: false; reason: "missing" | "mismatch" };

function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function normalizeSignatureCandidate(raw: string): string[] {
  const trimmed = raw.trim();
  const withoutPrefix = trimmed.startsWith("sha256=")
    ? trimmed.slice("sha256=".length).trim()
    : trimmed;
  return Array.from(new Set([trimmed, withoutPrefix].filter(Boolean)));
}

/**
 * Verifica autenticidad del webhook Culqi.
 *
 * Culqi Panel no documenta HMAC oficial; soportamos:
 * 1. HMAC-SHA256 del body crudo (hex / base64 / sha256=hex) en
 *    `x-culqi-signature` o `x-signature` — preferido (proxy o firmante).
 * 2. Query `?token=` con igualdad timing-safe al secret.
 * 3. Legacy: header igual al secret (compat; no prueba integridad del body).
 */
export function verifyCulqiWebhookAuth(input: {
  rawBody: string;
  signatureHeader: string | null;
  queryToken: string | null;
  secret: string;
}): CulqiWebhookAuthResult {
  const { rawBody, signatureHeader, queryToken, secret } = input;

  if (queryToken && timingSafeEqualString(queryToken, secret)) {
    return { ok: true, mode: "query-token" };
  }

  if (!signatureHeader?.trim()) {
    return { ok: false, reason: "missing" };
  }

  const candidates = normalizeSignatureCandidate(signatureHeader);
  const hmacHex = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const hmacBase64 = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");

  for (const candidate of candidates) {
    if (timingSafeEqualString(candidate, hmacHex) || timingSafeEqualString(candidate, hmacBase64)) {
      return { ok: true, mode: "hmac" };
    }
  }

  // Legacy shared-secret header (sin integridad del body).
  for (const candidate of candidates) {
    if (timingSafeEqualString(candidate, secret)) {
      return { ok: true, mode: "legacy-header" };
    }
  }

  return { ok: false, reason: "mismatch" };
}
