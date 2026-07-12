type CulqiLogLevel = "info" | "warn" | "error";

type CulqiLogPayload = {
  scope: "billing" | "event" | "webhook" | "checkout";
  action: string;
  ok: boolean;
  status?: number;
  code?: string;
  message?: string;
  meta?: Record<string, unknown>;
};

function sanitizeMeta(meta?: Record<string, unknown>) {
  if (!meta) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (/secret|password|authorization|sk_|pk_/i.test(key)) {
      out[key] = "[redacted]";
      continue;
    }
    if (typeof value === "string" && /^(sk|pk)_(test|live)_/i.test(value)) {
      out[key] = "[redacted]";
      continue;
    }
    out[key] = value;
  }
  return out;
}

/** Log estructurado para soporte (Vercel / agregadores). Prefijo estable: [culqi]. */
export function logCulqi(level: CulqiLogLevel, payload: CulqiLogPayload) {
  const entry = {
    ts: new Date().toISOString(),
    service: "culqi",
    level,
    ...payload,
    meta: sanitizeMeta(payload.meta),
  };

  const line = `[culqi] ${JSON.stringify(entry)}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export function logCulqiFailure(
  scope: CulqiLogPayload["scope"],
  action: string,
  error: unknown,
  meta?: Record<string, unknown>,
) {
  logCulqi("error", {
    scope,
    action,
    ok: false,
    message: error instanceof Error ? error.message : String(error),
    code: error instanceof Error ? error.name : "UnknownError",
    meta,
  });
}
