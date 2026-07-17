import { describe, expect, it } from "vitest";
import {
  BROADCAST_JOB_MAX_ATTEMPTS,
  BROADCAST_DELIVERY_LEASE_MS,
  BROADCAST_RETRY_MAX_MS,
  broadcastRetryDelayMs,
  canClaimBroadcastJob,
  decideBroadcastDeliveryClaim,
  nextBroadcastFailureState,
  nextExpiredBroadcastLeaseState,
} from "./broadcast-job-policy";

describe("broadcast durable job policy", () => {
  it("uses bounded exponential backoff", () => {
    expect(broadcastRetryDelayMs(1)).toBe(30_000);
    expect(broadcastRetryDelayMs(2)).toBe(60_000);
    expect(broadcastRetryDelayMs(20)).toBe(BROADCAST_RETRY_MAX_MS);
  });

  it("schedules retry before the attempt limit", () => {
    const now = new Date("2026-07-16T12:00:00.000Z");
    expect(nextBroadcastFailureState(2, now)).toEqual({
      status: "retry",
      nextAttemptAt: new Date("2026-07-16T12:01:00.000Z"),
      completedAt: null,
    });
  });

  it("fails permanently at the attempt limit", () => {
    const now = new Date("2026-07-16T12:00:00.000Z");
    expect(nextBroadcastFailureState(BROADCAST_JOB_MAX_ATTEMPTS, now)).toEqual({
      status: "failed",
      nextAttemptAt: now,
      completedAt: now,
    });
  });

  it("claims only due, retryable jobs", () => {
    const now = new Date("2026-07-16T12:00:00.000Z");
    const job = {
      status: "pending",
      attempts: 0,
      maxAttempts: 5,
      nextAttemptAt: now,
    };
    expect(canClaimBroadcastJob(job, now)).toBe(true);
    expect(canClaimBroadcastJob({ ...job, status: "processing" }, now)).toBe(false);
    expect(canClaimBroadcastJob({ ...job, attempts: 5 }, now)).toBe(false);
    expect(
      canClaimBroadcastJob(
        { ...job, nextAttemptAt: new Date(now.getTime() + 1) },
        now,
      ),
    ).toBe(false);
  });

  it("redelivers failures and expired leases but never completed channels", () => {
    const now = new Date("2026-07-16T12:00:00.000Z");
    expect(decideBroadcastDeliveryClaim(null, now)).toBe("deliver");
    expect(
      decideBroadcastDeliveryClaim({ status: "failed", lockedAt: now }, now),
    ).toBe("deliver");
    expect(
      decideBroadcastDeliveryClaim({ status: "completed", lockedAt: now }, now),
    ).toBe("already-delivered");
    expect(
      decideBroadcastDeliveryClaim(
        {
          status: "processing",
          lockedAt: new Date(now.getTime() - BROADCAST_DELIVERY_LEASE_MS - 1),
        },
        now,
      ),
    ).toBe("deliver");
    expect(
      decideBroadcastDeliveryClaim(
        {
          status: "processing",
          lockedAt: new Date(now.getTime() - BROADCAST_DELIVERY_LEASE_MS),
        },
        now,
      ),
    ).toBe("leased");
  });

  it("retries expired job leases until attempts are exhausted", () => {
    expect(nextExpiredBroadcastLeaseState(4, 5)).toBe("retry");
    expect(nextExpiredBroadcastLeaseState(5, 5)).toBe("failed");
  });
});
