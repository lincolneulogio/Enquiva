import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { sendBroadcastEmail } from "@/lib/mail";
import { pusherServer } from "@/lib/pusher/server";
import { PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher/shared";
import { invalidateCache, CACHE_KEYS } from "@/lib/redis";
import type { Locale } from "@/lib/i18n/core";

export type MassCommunicationNotificationType =
  | "event_published"
  | "registration_confirmed"
  | "event_cancelled"
  | "event_updated"
  | "event_reminder"
  | "waitlist_promoted"
  | "payment_submitted"
  | "payment_status_updated";

export type MassCommunicationChannels = {
  email: boolean;
  inApp: boolean;
  pusher: boolean;
};

export const DEFAULT_MASS_CHANNELS: MassCommunicationChannels = {
  email: true,
  inApp: true,
  pusher: true,
};

export type MassCommunicationRecipient = {
  id: string;
  name: string | null;
  email: string;
};

export type MassCommunicationPayload = {
  eventId: string;
  eventTitle: string;
  title: string;
  body: string;
  senderId: string;
  channels: MassCommunicationChannels;
  locale?: Locale;
  notificationType?: MassCommunicationNotificationType;
  metadata?: Record<string, unknown>;
};

export type MassDeliveryStats = {
  successCount: number;
  failureCount: number;
};

const DEFAULT_BATCH_SIZE = 8;

async function deliverToRecipient(
  recipient: MassCommunicationRecipient,
  payload: MassCommunicationPayload,
): Promise<boolean> {
  const {
    eventId,
    eventTitle,
    title,
    body,
    senderId,
    channels,
    locale = "es",
    notificationType = "event_reminder",
    metadata = {},
  } = payload;

  let delivered = false;

  try {
    if (channels.inApp) {
      await db.insert(notifications).values({
        userId: recipient.id,
        type: notificationType,
        title,
        message: body,
        read: false,
        metadata: { eventId, eventTitle, sentBy: senderId, ...metadata },
      });
      delivered = true;
    }

    if (channels.pusher) {
      try {
        await pusherServer.trigger(
          PUSHER_CHANNELS.userNotifications(recipient.id),
          PUSHER_EVENTS.notificationCreated,
          {
            title,
            message: body,
            type: notificationType,
            eventId,
          },
        );
      } catch (error) {
        console.error(`Pusher notification failed for user ${recipient.id}:`, error);
      }
    }

    if (channels.inApp || channels.pusher) {
      await invalidateCache(CACHE_KEYS.userNotificationsCount(recipient.id));
    }

    if (channels.email && recipient.email) {
      await sendBroadcastEmail({
        email: recipient.email,
        name: recipient.name,
        subject: title,
        message: body,
        eventTitle,
        locale,
      });
      delivered = true;
    }

    return delivered;
  } catch (error) {
    console.error(`Mass communication failed for user ${recipient.id}:`, error);
    return false;
  }
}

export async function deliverMassCommunication(
  recipients: MassCommunicationRecipient[],
  payload: MassCommunicationPayload,
  options?: { batchSize?: number },
): Promise<MassDeliveryStats> {
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const results = await Promise.all(batch.map((recipient) => deliverToRecipient(recipient, payload)));
    for (const ok of results) {
      if (ok) successCount++;
      else failureCount++;
    }
  }

  return { successCount, failureCount };
}

export async function resolveBroadcastRecipients(
  eventId: string,
  recipientStatus: "all" | "registered" | "checked_in" | "waitlisted",
): Promise<MassCommunicationRecipient[]> {
  const { registrations, users } = await import("@/lib/db/schema");
  const { eq, and, inArray } = await import("drizzle-orm");

  let statuses: ("registered" | "waitlisted" | "checked_in" | "cancelled")[] = [
    "registered",
    "checked_in",
    "waitlisted",
  ];

  if (recipientStatus === "registered") {
    statuses = ["registered"];
  } else if (recipientStatus === "checked_in") {
    statuses = ["checked_in"];
  } else if (recipientStatus === "waitlisted") {
    statuses = ["waitlisted"];
  } else if (recipientStatus === "all") {
    statuses = ["registered", "checked_in"];
  }

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(registrations)
    .innerJoin(users, eq(registrations.userId, users.id))
    .where(and(eq(registrations.eventId, eventId), inArray(registrations.status, statuses)));

  const unique = new Map<string, MassCommunicationRecipient>();
  for (const row of rows) {
    if (row.email) {
      unique.set(row.id, { id: row.id, name: row.name, email: row.email });
    }
  }

  return Array.from(unique.values());
}
