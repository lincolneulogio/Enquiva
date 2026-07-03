"use server";

import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and, desc, count, inArray } from "drizzle-orm";
import { getCached, setCached, invalidateCache, CACHE_KEYS, CACHE_TTL } from "@/lib/redis";
import { requireAuth } from "@/lib/auth/guards";

export async function getNotifications(limit = 20) {
  const user = await requireAuth();

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getNotificationsPaginated(page = 1, limit = 10) {
  const user = await requireAuth();
  const safeLimit = Math.max(1, Math.min(50, limit));
  const requestedPage = Math.max(1, page);

  const [totalRows, unreadRows] = await Promise.all([
    db
      .select({ total: count() })
      .from(notifications)
      .where(eq(notifications.userId, user.id)),
    db
      .select({ total: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.read, false))),
  ]);

  const total = totalRows[0]?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const safePage = Math.min(requestedPage, totalPages);
  const offset = (safePage - 1) * safeLimit;

  const items = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(safeLimit)
    .offset(offset);

  return {
    items,
    total,
    unread: unreadRows[0]?.total ?? 0,
    page: safePage,
    limit: safeLimit,
  };
}

export async function getRecentNotifications(limit = 8) {
  const items = await getNotifications(limit);
  const unreadCount = await getUnreadNotificationsCount();

  return {
    items,
    unreadCount,
  };
}

export async function getUnreadNotificationsCount(): Promise<number> {
  const user = await requireAuth();
  const cacheKey = CACHE_KEYS.userNotificationsCount(user.id);

  const cached = await getCached<number>(cacheKey);
  if (cached !== null) return cached;

  const [{ count: unreadCount }] = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(eq(notifications.userId, user.id), eq(notifications.read, false))
    );

  await setCached(cacheKey, unreadCount, CACHE_TTL.notificationsCount);
  return unreadCount;
}

export async function markNotificationsAsRead(notificationIds?: string[]) {
  const user = await requireAuth();

  if (notificationIds?.length) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, user.id),
          inArray(notifications.id, notificationIds)
        )
      );
  } else {
    // Mark all as read
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, user.id));
  }

  await invalidateCache(CACHE_KEYS.userNotificationsCount(user.id));
  return { success: true };
}
