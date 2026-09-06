import { db } from "@/lib/db";
import {
  broadcastJobRecipients,
  broadcastJobs,
  broadcastLogs,
  events,
} from "@/lib/db/schema";
import { eq, and, asc, inArray, lte, lt, sql } from "drizzle-orm";
import {
  deliverMassCommunication,
  resolveBroadcastRecipients,
} from "@/lib/notifications/mass-communication";
import { LogService } from "@/lib/analytics/audit";
import type { Locale } from "@/lib/i18n/core";
import {
  BROADCAST_JOB_LEASE_MS,
  broadcastLeaseCutoff,
  nextBroadcastFailureState,
} from "@/lib/notifications/broadcast-job-policy";
import { logger } from "@/lib/observability/structured-logger";
import { createDeliveryHooks } from "./broadcast-delivery-hooks";
import type { EnqueueBroadcastInput } from "./broadcast-queue-types";

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
