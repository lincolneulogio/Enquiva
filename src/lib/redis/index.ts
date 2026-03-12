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

// Cache keys
export const CACHE_KEYS = {
  publicEvents: "events:public",
  featuredEvents: "events:featured",
  eventBySlug: (slug: string) => `events:slug:${slug}`,
  userNotificationsCount: (userId: string) => `notifications:unread:${userId}`,
  eventAttendeesCount: (eventId: string) => `events:attendees:${eventId}`,
} as const;

export const CACHE_TTL = {
  publicEvents: 300,      // 5 minutes
  eventDetail: 300,       // 5 minutes
  featuredEvents: 600,    // 10 minutes
  notificationsCount: 60, // 1 minute
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
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Silent fail
  }
}
