import { db, type DBTransaction } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { triggerPusher } from "@/lib/pusher/server";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher/shared";
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
  static async create(payload: NotificationPayload, tx?: DBTransaction) {
    const rows = await this.createMany([payload], tx);
    return rows[0] ?? null;
  }

  static async createMany(payloads: NotificationPayload[], tx?: DBTransaction) {
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
  }
}
