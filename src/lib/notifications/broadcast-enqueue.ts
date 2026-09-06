import { db } from "@/lib/db";
import { broadcastJobRecipients, broadcastJobs } from "@/lib/db/schema";
import {
  resolveBroadcastRecipients,
  type MassCommunicationRecipient,
} from "@/lib/notifications/mass-communication";
import { BROADCAST_JOB_MAX_ATTEMPTS } from "@/lib/notifications/broadcast-job-policy";
import { logger } from "@/lib/observability/structured-logger";
import type { EnqueueBroadcastInput } from "./broadcast-queue-types";

export async function enqueueBroadcastJob(input: EnqueueBroadcastInput) {
  const recipients = await resolveBroadcastRecipients(input.eventId, input.recipientStatus);
  return enqueueResolvedBroadcastJob(input, recipients);
}

export async function enqueueResolvedBroadcastJob(
  input: Omit<EnqueueBroadcastInput, "recipientStatus"> & { recipientStatus: string },
  recipients: MassCommunicationRecipient[],
) {
  if (recipients.length === 0) {
    return { success: false as const, error: "NO_RECIPIENTS" };
  }

  const job = await db.transaction(async (tx) => {
    const [created] = await tx
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
        maxAttempts: BROADCAST_JOB_MAX_ATTEMPTS,
      })
      .returning({ id: broadcastJobs.id });

    await tx.insert(broadcastJobRecipients).values(
      recipients.map((recipient) => ({
        jobId: created.id,
        recipientId: recipient.id,
        name: recipient.name,
        email: recipient.email,
      })),
    );
    return created;
  });

  logger.info("broadcast.queued", {
    jobId: job.id,
    eventId: input.eventId,
    senderId: input.senderId,
    recipientCount: recipients.length,
  });

  return {
    success: true as const,
    queued: true as const,
    jobId: job.id,
    recipientCount: recipients.length,
  };
}
