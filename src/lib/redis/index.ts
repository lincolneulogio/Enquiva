import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { env } from "@/env";

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL || "https://placeholder.upstash.io",
  token: env.UPSTASH_REDIS_REST_TOKEN || "placeholder-token",
});

/**
 * Namespace por entorno: local y producción comparten la misma instancia
 * Upstash, así que cada key se prefija para que los datos no se filtren
 * entre entornos (settings de prod visibles en local y viceversa).
 * Orden: REDIS_KEY_PREFIX explícito > VERCEL_ENV > NODE_ENV.
 */
function resolveRedisKeyPrefix(): string {
  const explicit = process.env.REDIS_KEY_PREFIX?.trim();
  if (explicit) return explicit.endsWith(":") ? explicit : `${explicit}:`;
  const vercelEnv = process.env.VERCEL_ENV?.trim();
  if (vercelEnv) return `${vercelEnv}:`;
  return process.env.NODE_ENV === "production" ? "prod:" : "dev:";
}

export const REDIS_KEY_PREFIX = resolveRedisKeyPrefix();

/** Aplica el namespace del entorno a una key lógica (sin prefijo). */
export function nsKey(key: string): string {
  return `${REDIS_KEY_PREFIX}${key}`;
}

export const registrationRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: nsKey("ratelimit:registration"),
});

export const ticketVerifyRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true,
  prefix: nsKey("ratelimit:ticket_verify"),
});

export const chatRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "10 m"),
  analytics: true,
  prefix: nsKey("ratelimit:chat"),
});

/** Login/registro: checks de identidad y reenvío OTP (por IP). */
export const authIdentityRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
  prefix: nsKey("ratelimit:auth_identity"),
});

/** Confirmación OTP: limita fuerza bruta por IP y por identidad. */
export const otpVerificationRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(8, "15 m"),
  analytics: true,
  prefix: nsKey("ratelimit:otp_verification"),
});

/** Verificación de contraseña en acciones destructivas (por userId). */
export const passwordVerifyRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(8, "15 m"),
  analytics: true,
  prefix: nsKey("ratelimit:password_verify"),
});

/** Formulario público de contacto (anti-spam, por IP). */
export const contactRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  analytics: true,
  prefix: nsKey("ratelimit:contact"),
});

export const CACHE_KEYS = {
  publicEvents: "events:public",
  eventBySlug: (slug: string) => `events:slug:${slug}`,
  userNotificationsCount: (userId: string) => `notifications:unread:${userId}`,
  eventAttendeesCount: (eventId: string) => `events:attendees:${eventId}`,
  adminDashboardStats: (key: string) => `admin:stats:v3:${key}`,
  platformSettings: "platform:settings:v1",
  eventSpotlight: "events:spotlight-banner",
} as const;

export const CACHE_TTL = {
  publicEvents: 300,
  eventDetail: 300,
  notificationsCount: 60,
  adminDashboardStats: 300,
  platformSettings: 120,
  eventSpotlight: 120,
} as const;

export type CacheStats = {
  hits: number;
  misses: number;
  setErrors: number;
  getErrors: number;
  delErrors: number;
};

const cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  setErrors: 0,
  getErrors: 0,
  delErrors: 0,
};

export function getCacheStats(): CacheStats {
  return { ...cacheStats };
}

export function resetCacheStats(): void {
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.setErrors = 0;
  cacheStats.getErrors = 0;
  cacheStats.delErrors = 0;
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get<T>(nsKey(key));
    if (value != null) {
      cacheStats.hits++;
    } else {
      cacheStats.misses++;
    }
    return value;
  } catch (error) {
    cacheStats.getErrors++;
    console.error(`[redis] GET failed key=${key}:`, error);
    return null;
  }
}

export async function setCached<T>(key: string, value: T, ttl: number): Promise<void> {
  try {
    await redis.setex(nsKey(key), ttl, value);
  } catch (error) {
    cacheStats.setErrors++;
    console.error(`[redis] SETEX failed key=${key} ttl=${ttl}:`, error);
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(nsKey(key));
  } catch (error) {
    cacheStats.delErrors++;
    console.error(`[redis] DEL failed key=${key}:`, error);
  }
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    let cursor = "0";
    const namespaced = nsKey(pattern);
    do {
      const [nextCursor, keys] = await redis.scan(cursor, { match: namespaced, count: 100 });
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch (error) {
    cacheStats.delErrors++;
    console.error(`[redis] SCAN/DEL pattern failed pattern=${pattern}:`, error);
  }
}

export type RateLimitEnforceResult =
  | { ok: true }
  | { ok: false; reason: "limited" | "unavailable" };

/**
 * Aplica rate limit. Por defecto fail-closed: si Redis cae, se deniega la operación.
 */
export async function enforceRateLimit(
  limiter: Ratelimit,
  key: string,
  options?: { failClosed?: boolean },
): Promise<RateLimitEnforceResult> {
  const failClosed = options?.failClosed !== false;
  try {
    const { success } = await limiter.limit(key);
    if (!success) return { ok: false, reason: "limited" };
    return { ok: true };
  } catch (error) {
    console.error(`[redis] rate limit unavailable key=${key}:`, error);
    if (failClosed) return { ok: false, reason: "unavailable" };
    return { ok: true };
  }
}
