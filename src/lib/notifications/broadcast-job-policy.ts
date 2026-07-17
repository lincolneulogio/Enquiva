export const BROADCAST_JOB_MAX_ATTEMPTS = 5;
export const BROADCAST_JOB_LEASE_MS = 15 * 60 * 1000;
export const BROADCAST_DELIVERY_LEASE_MS = 20 * 60 * 1000;
export const BROADCAST_RETRY_BASE_MS = 30 * 1000;
export const BROADCAST_RETRY_MAX_MS = 30 * 60 * 1000;

export function broadcastLeaseCutoff(now: Date, leaseMs: number): Date {
  return new Date(now.getTime() - leaseMs);
}

export function broadcastRetryDelayMs(attempt: number): number {
  const exponent = Math.max(0, attempt - 1);
  return Math.min(BROADCAST_RETRY_MAX_MS, BROADCAST_RETRY_BASE_MS * 2 ** exponent);
}

export function canClaimBroadcastJob(
  job: {
    status: string;
    attempts: number;
    maxAttempts: number;
    nextAttemptAt: Date;
  },
  now: Date,
): boolean {
  return (
    (job.status === "pending" || job.status === "retry") &&
    job.attempts < job.maxAttempts &&
    job.nextAttemptAt.getTime() <= now.getTime()
  );
}

export function decideBroadcastDeliveryClaim(
  delivery: { status: string; lockedAt: Date } | null,
  now: Date,
): "deliver" | "already-delivered" | "leased" {
  if (!delivery || delivery.status === "failed") return "deliver";
  if (delivery.status === "completed") return "already-delivered";
  if (
    delivery.status === "processing" &&
    delivery.lockedAt.getTime() <
      broadcastLeaseCutoff(now, BROADCAST_DELIVERY_LEASE_MS).getTime()
  ) {
    return "deliver";
  }
  return "leased";
}

export function nextExpiredBroadcastLeaseState(attempts: number, maxAttempts: number) {
  return attempts >= maxAttempts ? "failed" : "retry";
}

export function nextBroadcastFailureState(attempt: number, now = new Date()) {
  if (attempt >= BROADCAST_JOB_MAX_ATTEMPTS) {
    return {
      status: "failed" as const,
      nextAttemptAt: now,
      completedAt: now,
    };
  }

  return {
    status: "retry" as const,
    nextAttemptAt: new Date(now.getTime() + broadcastRetryDelayMs(attempt)),
    completedAt: null,
  };
}
