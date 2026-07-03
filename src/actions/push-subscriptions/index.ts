"use server";

import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/guards";

interface SubscribeInput {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Controller Server Action: Registers or updates a browser Web Push subscription for the active user.
 */
export async function subscribeToPushAction(input: SubscribeInput) {
  try {
    const user = await requireAuth();

    await db
      .insert(pushSubscriptions)
      .values({
        userId: user.id,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
      })
      .onConflictDoUpdate({
        target: [pushSubscriptions.endpoint],
        set: {
          userId: user.id,
          p256dh: input.p256dh,
          auth: input.auth,
        },
      });

    return { success: true };
  } catch (err) {
    console.error("Failed to subscribe user to Web Push:", err);
    throw err;
  }
}

/**
 * Controller Server Action: Removes a registered Web Push endpoint from the user's active subscriptions.
 */
export async function unsubscribeFromPushAction(endpoint: string) {
  try {
    const user = await requireAuth();

    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.endpoint, endpoint),
          eq(pushSubscriptions.userId, user.id)
        )
      );

    return { success: true };
  } catch (err) {
    console.error("Failed to unsubscribe user from Web Push:", err);
    throw err;
  }
}
