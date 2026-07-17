import { db } from "@/lib/db";
import {
  broadcastJobDeliveries,
  broadcastJobRecipients,
  broadcastJobs,
  broadcastLogs,
  events,
} from "@/lib/db/schema";
import { eq, and, asc, inArray, lte, lt, or, sql } from "drizzle-orm";
import {
  deliverMassCommunication,
  resolveBroadcastRecipients,
  type MassCommunicationChannels,
  type MassDeliveryChannel,
  type MassCommunicationRecipient,
} from "@/lib/notifications/mass-communication";
import { LogService } from "@/lib/analytics/audit";
import type { Locale } from "@/lib/i18n/core";
import {
  BROADCAST_DELIVERY_LEASE_MS,
  BROADCAST_JOB_LEASE_MS,
  BROADCAST_JOB_MAX_ATTEMPTS,
  broadcastLeaseCutoff,
  nextBroadcastFailureState,
} from "@/lib/notifications/broadcast-job-policy";
import { logger } from "@/lib/observability/structured-logger";

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

export async function processBroadcastJob(
  jobId: string,
  audit?: { actorName: string; ipAddress?: string; userAgent?: string },
) {
  const now = new Date();
  const [job] = await db
    .update(broadcastJobs)
    .set({
      status: "processing",
      startedAt: now,
      lockedAt: now,
      attempts: sql`${broadcastJobs.attempts} + 1`,
      errorMessage: null,
    })
    .where(
      and(
        eq(broadcastJobs.id, jobId),
        inArray(broadcastJobs.status, ["pending", "retry"]),
        lte(broadcastJobs.nextAttemptAt, now),
        lt(broadcastJobs.attempts, broadcastJobs.maxAttempts),
      ),
    )
    .returning();

  // Correctness depends on this conditional UPDATE: a worker that did not
  // receive the row from RETURNING must never deliver it.
  if (!job) return false;

  logger.info("broadcast.claimed", {
    jobId,
    eventId: job.eventId,
    attempt: job.attempts,
  });

  try {
    const [event] = await db
      .select({ id: events.id, title: events.title })
      .from(events)
      .where(eq(events.id, job.eventId))
      .limit(1);

    if (!event) {
      throw new Error("Event not found");
    }

    const snapshottedRecipients = await db
      .select({
        id: broadcastJobRecipients.recipientId,
        name: broadcastJobRecipients.name,
        email: broadcastJobRecipients.email,
      })
      .from(broadcastJobRecipients)
      .where(eq(broadcastJobRecipients.jobId, job.id));
    const recipients =
      snapshottedRecipients.length > 0
        ? snapshottedRecipients
        : await resolveBroadcastRecipients(
            job.eventId,
            job.recipientStatus as EnqueueBroadcastInput["recipientStatus"],
          );

    const { successCount, failureCount } = await deliverMassCommunication(
      recipients,
      {
        eventId: job.eventId,
        eventTitle: event.title,
        title: job.subject,
        body: job.message,
        senderId: job.senderId,
        channels: job.channels,
        locale: (job.locale as Locale) ?? "es",
        metadata: { broadcastJobId: job.id, recipientStatus: job.recipientStatus },
      },
      {
        hooks: createDeliveryHooks(job.id),
      },
    );

    if (failureCount > 0) {
      throw new Error(`${failureCount} recipient(s) still have failed channels`);
    }

    await db
      .insert(broadcastLogs)
      .values({
        jobId: job.id,
        eventId: job.eventId,
        senderId: job.senderId,
        subject: job.subject,
        message: job.message,
        recipientCount: `${successCount} enviados, ${failureCount} fallidos`,
      })
      .onConflictDoNothing({ target: broadcastLogs.jobId });

    await db
      .update(broadcastJobs)
      .set({
        status: "completed",
        successCount,
        failureCount,
        completedAt: new Date(),
        lockedAt: null,
      })
      .where(and(eq(broadcastJobs.id, jobId), eq(broadcastJobs.status, "processing")));

    try {
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
    } catch (auditError) {
      logger.warn("broadcast.audit_failed", {
        jobId,
        error: auditError instanceof Error ? auditError.message : "Unknown audit error",
      });
    }
    logger.info("broadcast.completed", {
      jobId,
      eventId: job.eventId,
      attempt: job.attempts,
      successCount,
      failureCount,
    });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const failureState = nextBroadcastFailureState(job.attempts);
    await db
      .update(broadcastJobs)
      .set({
        ...failureState,
        errorMessage: message.slice(0, 2_000),
        lockedAt: null,
      })
      .where(and(eq(broadcastJobs.id, jobId), eq(broadcastJobs.status, "processing")));
    logger.error("broadcast.attempt_failed", {
      jobId,
      eventId: job.eventId,
      attempt: job.attempts,
      nextStatus: failureState.status,
      nextAttemptAt: failureState.nextAttemptAt?.toISOString() ?? null,
      error: message,
    });
    return true;
  }
}

function createDeliveryHooks(jobId: string) {
  return {
    heartbeat: async () => {
      await db
        .update(broadcastJobs)
        .set({ lockedAt: new Date() })
        .where(and(eq(broadcastJobs.id, jobId), eq(broadcastJobs.status, "processing")));
    },
    claim: async (
      recipient: MassCommunicationRecipient,
      channel: MassDeliveryChannel,
    ): Promise<"deliver" | "already-delivered"> => {
      const now = new Date();
      const staleBefore = broadcastLeaseCutoff(now, BROADCAST_DELIVERY_LEASE_MS);
      const claimed = await db
        .insert(broadcastJobDeliveries)
        .values({
          jobId,
          recipientId: recipient.id,
          channel,
          status: "processing",
          lockedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            broadcastJobDeliveries.jobId,
            broadcastJobDeliveries.recipientId,
            broadcastJobDeliveries.channel,
          ],
          set: {
            status: "processing",
            lockedAt: now,
            attempts: sql`${broadcastJobDeliveries.attempts} + 1`,
            errorMessage: null,
          },
          setWhere: or(
            eq(broadcastJobDeliveries.status, "failed"),
            and(
              eq(broadcastJobDeliveries.status, "processing"),
              lt(broadcastJobDeliveries.lockedAt, staleBefore),
            ),
          ),
        })
        .returning({ id: broadcastJobDeliveries.id });

      if (claimed.length > 0) return "deliver";

      const [existing] = await db
        .select({ status: broadcastJobDeliveries.status })
        .from(broadcastJobDeliveries)
        .where(
          and(
            eq(broadcastJobDeliveries.jobId, jobId),
            eq(broadcastJobDeliveries.recipientId, recipient.id),
            eq(broadcastJobDeliveries.channel, channel),
          ),
        )
        .limit(1);
      if (existing?.status === "completed") return "already-delivered";
      throw new Error(`Delivery is leased: ${recipient.id}/${channel}`);
    },
    complete: async (recipient: MassCommunicationRecipient, channel: MassDeliveryChannel) => {
      await db
        .update(broadcastJobDeliveries)
        .set({ status: "completed", completedAt: new Date(), errorMessage: null })
        .where(
          and(
            eq(broadcastJobDeliveries.jobId, jobId),
            eq(broadcastJobDeliveries.recipientId, recipient.id),
            eq(broadcastJobDeliveries.channel, channel),
            eq(broadcastJobDeliveries.status, "processing"),
          ),
        );
    },
    fail: async (
      recipient: MassCommunicationRecipient,
      channel: MassDeliveryChannel,
      error: unknown,
    ) => {
      const message = error instanceof Error ? error.message : "Unknown delivery error";
      await db
        .update(broadcastJobDeliveries)
        .set({ status: "failed", errorMessage: message.slice(0, 2_000) })
        .where(
          and(
            eq(broadcastJobDeliveries.jobId, jobId),
            eq(broadcastJobDeliveries.recipientId, recipient.id),
            eq(broadcastJobDeliveries.channel, channel),
            eq(broadcastJobDeliveries.status, "processing"),
          ),
        );
    },
  };
}

export async function recoverStuckBroadcastJobs(now = new Date()) {
  const staleBefore = broadcastLeaseCutoff(now, BROADCAST_JOB_LEASE_MS);
  const failed = await db
    .update(broadcastJobs)
    .set({
      status: "failed",
      completedAt: now,
      lockedAt: null,
      errorMessage: "Lease expired after the maximum number of attempts",
    })
    .where(
      and(
        eq(broadcastJobs.status, "processing"),
        lt(broadcastJobs.lockedAt, staleBefore),
        sql`${broadcastJobs.attempts} >= ${broadcastJobs.maxAttempts}`,
      ),
    )
    .returning({ id: broadcastJobs.id });

  const retried = await db
    .update(broadcastJobs)
    .set({
      status: "retry",
      nextAttemptAt: now,
      lockedAt: null,
      errorMessage: "Previous worker lease expired",
    })
    .where(
      and(
        eq(broadcastJobs.status, "processing"),
        lt(broadcastJobs.lockedAt, staleBefore),
        lt(broadcastJobs.attempts, broadcastJobs.maxAttempts),
      ),
    )
    .returning({ id: broadcastJobs.id });

  return { recovered: retried.length, failed: failed.length };
}

export async function processPendingBroadcastJobs(limit = 100) {
  const recovery = await recoverStuckBroadcastJobs();
  let processed = 0;

  while (processed < limit) {
    const candidates = await db
      .select({ id: broadcastJobs.id })
      .from(broadcastJobs)
      .where(
        and(
          inArray(broadcastJobs.status, ["pending", "retry"]),
          lte(broadcastJobs.nextAttemptAt, new Date()),
        ),
      )
      .orderBy(asc(broadcastJobs.createdAt))
      .limit(Math.min(10, limit - processed));

    if (candidates.length === 0) break;

    let claimedThisPass = 0;
    for (const candidate of candidates) {
      if (await processBroadcastJob(candidate.id)) {
        processed++;
        claimedThisPass++;
      }
    }
    if (claimedThisPass === 0) break;
  }

  return { processed, ...recovery, exhausted: processed >= limit };
}
