import { NotificationService } from "@/lib/notifications/notification.service";
import type { Locale } from "@/lib/i18n/core";
import { env } from "@/env";
import {
  chunkRecipients,
  resolveBroadcastBatchSize,
} from "@/lib/notifications/broadcast-batch";
import { sendBroadcastEmail } from "@/lib/mail";
import { db } from "@/lib/db";

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

const DEFAULT_BATCH_SIZE = resolveBroadcastBatchSize(env.BROADCAST_BATCH_SIZE);

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
      await NotificationService.create({
        userId: recipient.id,
        type: notificationType,
        title,
        message: body,
        metadata: { eventId, eventTitle, sentBy: senderId, ...metadata },
      });
      delivered = true;
    } else if (channels.pusher) {
      try {
        await NotificationService.deliver([
          {
            userId: recipient.id,
            type: notificationType,
            title,
            message: body,
            metadata: { eventId, eventTitle, sentBy: senderId, ...metadata },
          },
        ]);
      } catch (error) {
        console.error(`Pusher notification failed for user ${recipient.id}:`, error);
      }
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

  for (const batch of chunkRecipients(recipients, batchSize)) {
    const results = await Promise.all(batch.map((recipient) => deliverToRecipient(recipient, payload)));
    for (const ok of results) {
      if (ok) successCount++;
      else failureCount++;
    }
  }

  return { successCount, failureCount };
}

export type BroadcastRecipientFilter =
  | "all"
  | "registered"
  | "checked_in"
  | "waitlisted"
  | "unpaid";

export async function resolveBroadcastRecipients(
  eventId: string,
  recipientStatus: BroadcastRecipientFilter,
): Promise<MassCommunicationRecipient[]> {
  const { registrations, users, payments } = await import("@/lib/db/schema");
  const { eq, and, inArray, or, isNull, ne } = await import("drizzle-orm");

  if (recipientStatus === "unpaid") {
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(registrations)
      .innerJoin(users, eq(registrations.userId, users.id))
      .leftJoin(payments, eq(payments.registrationId, registrations.id))
      .where(
        and(
          eq(registrations.eventId, eventId),
          inArray(registrations.status, ["registered", "checked_in"]),
          or(isNull(payments.id), ne(payments.status, "approved")),
        ),
      );

    const unique = new Map<string, MassCommunicationRecipient>();
    for (const row of rows) {
      if (row.email) {
        unique.set(row.id, { id: row.id, name: row.name, email: row.email });
      }
    }
    return Array.from(unique.values());
  }

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
