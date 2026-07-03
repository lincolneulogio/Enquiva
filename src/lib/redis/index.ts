import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { env } from "@/env";

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// Rate limiter: 10 requests per 10 seconds per IP
export const registrationRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
  prefix: "ratelimit:registration",
});

// Rate limiter for ticket verification: 30 requests per minute per IP
export const ticketVerifyRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true,
  prefix: "ratelimit:ticket_verify",
});

/** Copilot: mensajes por usuario (además del límite de plan AI). */
export const chatRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "10 m"),
  analytics: true,
  prefix: "ratelimit:chat",
});

// Cache keys
export const CACHE_KEYS = {
  publicEvents: "events:public",
  featuredEvents: "events:featured",
  eventBySlug: (slug: string) => `events:slug:${slug}`,
  userNotificationsCount: (userId: string) => `notifications:unread:${userId}`,
  eventAttendeesCount: (eventId: string) => `events:attendees:${eventId}`,
  adminDashboardStats: (key: string) => `admin:stats:${key}`,
} as const;

export const CACHE_TTL = {
  publicEvents: 300,      // 5 minutes
  eventDetail: 300,       // 5 minutes
  featuredEvents: 600,    // 10 minutes
  notificationsCount: 60, // 1 minute
  adminDashboardStats: 300, // 5 minutes
} as const;

// Cache utilities
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key);
  } catch {
    return null;
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttl: number
): Promise<void> {
  try {
    await redis.setex(key, ttl, value);
  } catch {
    // Silent fail — cache is non-critical
  }
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    // Silent fail
  }
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(cursor, { match: pattern, count: 100 });
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch {
    // Silent fail
  }
}
