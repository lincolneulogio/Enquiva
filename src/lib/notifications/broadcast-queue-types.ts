import type { Locale } from "@/lib/i18n/core";
import type { MassCommunicationChannels } from "@/lib/notifications/mass-communication";

export type EnqueueBroadcastInput = {
  eventId: string;
  senderId: string;
  senderName: string;
  subject: string;
  message: string;
  recipientStatus: "all" | "registered" | "checked_in" | "waitlisted" | "unpaid";
  channels: MassCommunicationChannels;
  locale: Locale;
  ipAddress?: string;
  userAgent?: string;
};
