import { db } from "@/lib/db";
import { broadcastJobs, broadcastLogs, events } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import {
  deliverMassCommunication,
  resolveBroadcastRecipients,
  type MassCommunicationChannels,
} from "@/lib/notifications/mass-communication";
import { LogService } from "@/lib/analytics/audit";
import { runBackground } from "@/lib/background";
import type { Locale } from "@/lib/i18n/core";

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

export async function enqueueBroadcastJob(input: EnqueueBroadcastInput) {
  const recipients = await resolveBroadcastRecipients(input.eventId, input.recipientStatus);

  if (recipients.length === 0) {
    return { success: false as const, error: "NO_RECIPIENTS" };
  }

  const [job] = await db
    .insert(broadcastJobs)
    .values({
      eventId: input.eventId,
      senderId: input.senderId,
      subject: input.subject,
      message: input.message,
      recipientStatus: input.recipientStatus,
      channels: input.channels,
      locale: input.locale,
      status: "pending",
      totalRecipients: recipients.length,
    })
    .returning({ id: broadcastJobs.id });

  runBackground(() =>
    processBroadcastJob(job.id, {
      actorName: input.senderName,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    }),
  );

  return {
    success: true as const,
    queued: true as const,
    jobId: job.id,
    recipientCount: recipients.length,
  };
}

export async function processBroadcastJob(
  jobId: string,
  audit?: { actorName: string; ipAddress?: string; userAgent?: string },
) {
  const [job] = await db.select().from(broadcastJobs).where(eq(broadcastJobs.id, jobId)).limit(1);
  if (!job || job.status === "completed" || job.status === "failed") return;

  const claimed = await db
    .update(broadcastJobs)
    .set({ status: "processing", startedAt: new Date() })
    .where(and(eq(broadcastJobs.id, jobId), eq(broadcastJobs.status, "pending")))
    .returning({ id: broadcastJobs.id });

  if (claimed.length === 0 && job.status !== "processing") return;

  try {
    const [event] = await db
      .select({ id: events.id, title: events.title })
      .from(events)
      .where(eq(events.id, job.eventId))
      .limit(1);

    if (!event) {
      throw new Error("Event not found");
    }

    const recipients = await resolveBroadcastRecipients(
      job.eventId,
      job.recipientStatus as EnqueueBroadcastInput["recipientStatus"],
    );

    const { successCount, failureCount } = await deliverMassCommunication(recipients, {
      eventId: job.eventId,
      eventTitle: event.title,
      title: job.subject,
      body: job.message,
      senderId: job.senderId,
      channels: job.channels,
      locale: (job.locale as Locale) ?? "es",
      metadata: { broadcastJobId: job.id, recipientStatus: job.recipientStatus },
    });

    await db.insert(broadcastLogs).values({
      eventId: job.eventId,
      senderId: job.senderId,
      subject: job.subject,
      message: job.message,
      recipientCount: `${successCount} enviados, ${failureCount} fallidos`,
    });

    await db
      .update(broadcastJobs)
      .set({
        status: "completed",
        successCount,
        failureCount,
        completedAt: new Date(),
      })
      .where(eq(broadcastJobs.id, jobId));

    await LogService.log({
      actorId: job.senderId,
      actorName: audit?.actorName ?? "Sistema",
      action: "broadcast.send",
      entityType: "event",
      entityId: job.eventId,
      details: `Broadcast multicanal para "${event.title}": ${successCount} entregas, ${failureCount} fallos. Filtro: ${job.recipientStatus}`,
      ipAddress: audit?.ipAddress ?? null,
      userAgent: audit?.userAgent ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    await db
      .update(broadcastJobs)
      .set({
        status: "failed",
        errorMessage: message,
        completedAt: new Date(),
      })
      .where(eq(broadcastJobs.id, jobId));
    console.error(`[broadcast-queue] Job ${jobId} failed:`, error);
  }
}

export async function processPendingBroadcastJobs(limit = 3) {
  const pending = await db
    .select({ id: broadcastJobs.id })
    .from(broadcastJobs)
    .where(eq(broadcastJobs.status, "pending"))
    .orderBy(asc(broadcastJobs.createdAt))
    .limit(limit);

  for (const job of pending) {
    await processBroadcastJob(job.id);
  }

  return pending.length;
}
