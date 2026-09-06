import { db } from "@/lib/db";
import { broadcastJobDeliveries, broadcastJobs } from "@/lib/db/schema";
import { eq, and, lt, or, sql } from "drizzle-orm";
import type {
  MassDeliveryChannel,
  MassCommunicationRecipient,
} from "@/lib/notifications/mass-communication";
import {
  BROADCAST_DELIVERY_LEASE_MS,
  broadcastLeaseCutoff,
} from "@/lib/notifications/broadcast-job-policy";

export function createDeliveryHooks(jobId: string) {
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
