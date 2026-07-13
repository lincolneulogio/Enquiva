import { db, type DBClient } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { triggerPusher } from "@/lib/pusher/server";
import { PUSHER_CHANNELS, PUSHER_EVENTS, type TableRefreshPayload } from "@/lib/pusher/shared";
import { broadcastTableRefresh } from "@/lib/pusher/table-refresh";
import { invalidateCache, CACHE_KEYS } from "@/lib/redis";

export type NotificationType =
  | "event_published"
  | "registration_confirmed"
  | "event_cancelled"
  | "event_updated"
  | "event_reminder"
  | "waitlist_promoted"
  | "payment_submitted"
  | "payment_status_updated"
  | "organizer_request"
  | "organizer_approved"
  | "organizer_rejected"
  | "subscription_alert"
  | "transport_alert";

export type NotificationPayload = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

export class NotificationService {
  static async create(payload: NotificationPayload, tx?: DBClient) {
    const rows = await this.createMany([payload], tx);
    return rows[0] ?? null;
  }

  static async createMany(payloads: NotificationPayload[], tx?: DBClient) {
    if (payloads.length === 0) return [];

    const executor = tx ?? db;
    const rows = await executor
      .insert(notifications)
      .values(
        payloads.map((payload) => ({
          userId: payload.userId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          metadata: payload.metadata,
        })),
      )
      .returning();

    if (!tx) {
      await this.deliver(payloads);
    }

    return rows;
  }

  /** Invalida caché y envía Pusher tras commit de transacción. */
  static async deliver(payloads: NotificationPayload[]) {
    if (payloads.length === 0) return;

    const userIds = [...new Set(payloads.map((payload) => payload.userId))];
    await Promise.all(
      userIds.map((userId) => invalidateCache(CACHE_KEYS.userNotificationsCount(userId))),
    );

    await Promise.all(
      payloads.map((payload) =>
        triggerPusher(PUSHER_CHANNELS.userNotifications(payload.userId), PUSHER_EVENTS.notificationCreated, {
          title: payload.title,
          message: payload.message,
          type: payload.type,
          ...payload.metadata,
        }),
      ),
    );

    const { sendWebPushToUser } = await import("@/lib/push/web-push");
    const { getSystemSettings } = await import("@/lib/settings");
    const { resolvePushNotificationTitle } = await import("@/lib/push/branding");
    const brandTitle = resolvePushNotificationTitle(await getSystemSettings());

    await Promise.all(
      payloads.map((payload) =>
        sendWebPushToUser(
          payload.userId,
          {
            title: payload.title,
            body: payload.message,
          },
          { brandTitle },
        ).catch((error) => {
          console.error("[web-push] deliver failed", error);
        }),
      ),
    );

    await broadcastTableRefreshForNotifications(payloads);
  }
}

function tableResourcesForNotification(payload: NotificationPayload) {
  const meta = payload.metadata ?? {};

  const map: Partial<Record<NotificationType, TableRefreshPayload["resource"]>> = {
    registration_confirmed: ["registrations", "attendees", "payments", "events"],
    waitlist_promoted: ["registrations", "attendees", "events"],
    payment_submitted: ["payments", "registrations", "attendees"],
    payment_status_updated: ["payments", "registrations", "attendees", "events"],
    event_published: ["events"],
    event_updated: meta.registrationId
      ? ["registrations", "attendees", "events"]
      : ["events"],
    event_cancelled: ["events", "registrations", "attendees"],
    event_reminder: ["events"],
    organizer_request: ["users", "team"],
    organizer_approved: ["users", "team"],
    organizer_rejected: ["users", "team"],
    transport_alert: ["transport", "registrations", "attendees"],
    subscription_alert: ["plans", "payments"],
  };

  return map[payload.type];
}

async function broadcastTableRefreshForNotifications(payloads: NotificationPayload[]) {
  const seen = new Set<string>();

  for (const payload of payloads) {
    const resource = tableResourcesForNotification(payload);
    if (!resource) continue;

    const eventId = typeof payload.metadata?.eventId === "string" ? payload.metadata.eventId : undefined;
    const organizationId =
      typeof payload.metadata?.organizationId === "string" ? payload.metadata.organizationId : undefined;

    const key = JSON.stringify({ resource, eventId, organizationId, userId: payload.userId });
    if (seen.has(key)) continue;
    seen.add(key);

    await broadcastTableRefresh({
      resource,
      eventId,
      organizationId,
      userId: payload.userId,
    });
  }
}
