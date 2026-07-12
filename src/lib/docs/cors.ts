import { env } from "@/env";

const STATIC_ALLOWED = new Set(
  [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:4321",
    "http://127.0.0.1:4321",
    env.NEXT_PUBLIC_APP_URL,
    env.NEXT_PUBLIC_DOCS_URL,
  ].filter(Boolean) as string[],
);

function parseExtraOrigins(): string[] {
  const raw = process.env.DOCS_CORS_ORIGINS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((v) => v.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

/** Allowlist exacta de orígenes para /api/docs/auth (sin includes laxos). */
export function isDocsCorsOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  const normalized = origin.replace(/\/$/, "");
  if (STATIC_ALLOWED.has(normalized)) return true;
  return parseExtraOrigins().includes(normalized);
}
