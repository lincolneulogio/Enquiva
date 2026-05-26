import webpush from "web-push";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const privateKey = process.env.VAPID_PRIVATE_KEY || "";
const subject = process.env.VAPID_SUBJECT || "mailto:admin@encuentrodefe.site";

let isVapidConfigured = false;
if (publicKey && privateKey) {
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    isVapidConfigured = true;
  } catch (err) {
    console.error("Failed to set web-push VAPID details:", err);
  }
} else {
  console.warn("VAPID keys not configured in .env. Push notifications are disabled in this environment.");
}

/**
 * Sends a native lock-screen Push Notification to all active browser endpoints registered by a user.
 * Automatically cleans up invalid or expired endpoints from the database (e.g., if notifications were blocked).
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  url = "/member/tickets"
): Promise<{ success: boolean; sentCount?: number; reason?: string }> {
  if (!isVapidConfigured) {
    console.warn("Skipping push notification: VAPID details not configured.");
    return { success: false, reason: "VAPID_NOT_CONFIGURED" };
  }

  try {
    // Fetch subscriptions for this user
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subs.length === 0) {
      return { success: true, sentCount: 0 };
    }

    const payload = JSON.stringify({ title, body, url });
    let sentCount = 0;

    await Promise.all(
      subs.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          };

          await webpush.sendNotification(pushSubscription, payload);
          sentCount++;
        } catch (error: any) {
          // If subscription has expired or is invalid (e.g. 410 Gone or 404 Not Found), delete it
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`Push subscription expired/invalid (status ${error.statusCode}). Deleting:`, sub.endpoint);
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
          } else {
            console.error("Failed to send push notification to subscription:", error);
          }
        }
      })
    );

    return { success: true, sentCount };
  } catch (err) {
    console.error("Failed to execute sendPushNotification query:", err);
    return { success: false, reason: "QUERY_FAILED" };
  }
}
