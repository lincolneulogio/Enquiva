"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { assertCanSendBroadcast } from "@/lib/billing/enforce";
import { assertOwnOrAnyPermission } from "@/lib/auth/permission-guards";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { assertEventInAdminScope } from "@/lib/organizations/admin-scope";
import { requireAuth, requireApprovedEventManager } from "@/lib/auth/guards";
import { enqueueBroadcastJob } from "@/lib/notifications/broadcast-queue";
import { DEFAULT_MASS_CHANNELS, type MassCommunicationChannels } from "@/lib/notifications/mass-communication";
import { getLocale } from "@/lib/i18n/server";

export async function sendBroadcastAction(input: {
  eventId: string;
  subject: string;
  message: string;
  recipientStatus: "all" | "registered" | "checked_in" | "waitlisted" | "unpaid";
  channels?: Partial<MassCommunicationChannels>;
}) {
  await requireAuth();
  const user = await requireApprovedEventManager();

  if (!input.eventId || !input.subject || !input.message) {
    throw new Error("Missing required fields");
  }

  await assertCanSendBroadcast(user.id, user.role);

  const event = await db.query.events.findFirst({
    where: eq(events.id, input.eventId),
  });

  if (!event) {
    throw new Error("Event not found");
  }

  await assertOwnOrAnyPermission(user, {
    anyPermission: "broadcasts:send:org",
    ownPermission: "broadcasts:send:own",
    isOwner: event.organizerId === user.id,
    organizationId: event.organizationId,
    organizerId: event.organizerId,
    resourceId: event.id,
    resourceType: "broadcast",
  });
  await assertEventInAdminScope(input.eventId, user.id, user.role);

  const locale = await getLocale();
  const hdrs = await headers();
  const channels: MassCommunicationChannels = {
    ...DEFAULT_MASS_CHANNELS,
    ...input.channels,
  };

  const result = await enqueueBroadcastJob({
    eventId: input.eventId,
    senderId: user.id,
    senderName: user.name ?? user.email,
    subject: input.subject,
    message: input.message,
    recipientStatus: input.recipientStatus,
    channels,
    locale,
    ipAddress: hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "unknown",
    userAgent: hdrs.get("user-agent") ?? "unknown",
  });

  if (!result.success) {
    return {
      success: false as const,
      error:
        result.error === "NO_RECIPIENTS"
          ? "NO_RECIPIENTS"
          : "Failed to queue broadcast",
    };
  }

  revalidatePath("/organizer/broadcasts");
  revalidatePath("/admin/broadcasts");

  return {
    success: true as const,
    queued: true as const,
    jobId: result.jobId,
    recipientCount: result.recipientCount,
  };
}

/** @deprecated Use sendBroadcastAction */
export async function sendBroadcastEmailAction(input: {
  eventId: string;
  subject: string;
  message: string;
  recipientStatus: "all" | "registered" | "checked_in" | "waitlisted" | "unpaid";
}) {
  await requireAuth();
  const result = await sendBroadcastAction({
    ...input,
    channels: { email: true, inApp: false, pusher: false },
  });

  if (!result.success) {
    return {
      success: false,
      error:
        result.error === "NO_RECIPIENTS"
          ? "No se encontraron destinatarios con el filtro seleccionado."
          : "No se pudo encolar el comunicado.",
    };
  }

  return {
    success: true,
    queued: true,
    recipientsCount: result.recipientCount,
    successCount: result.recipientCount,
    failureCount: 0,
  };
}
