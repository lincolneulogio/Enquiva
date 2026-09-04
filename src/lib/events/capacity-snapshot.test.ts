import { describe, expect, it, vi } from "vitest";
import { getEffectiveEventCapacity } from "@/lib/billing/enforce";
import { getEventCapacitySnapshot } from "./capacity-snapshot";
import type { ResolvedPlan } from "@/lib/billing/types";

// Mock database calls in getEventCapacitySnapshot
vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([{ occupied: 15, waitlisted: 3 }]),
      }),
    }),
  },
}));

const mockFreePlan: ResolvedPlan = {
  id: "plan-free",
  slug: "free",
  name: "Gratis",
  description: "Plan gratuito",
  priceMonthly: 0,
  currency: "PEN",
  maxActiveEvents: 1,
  maxAttendeesPerEvent: 100,
  commissionPercent: 8,
  commissionPerRegistration: 0.5,
  maxBroadcastsPerMonth: 0,
  maxAiMessagesPerMonth: 0,
  maxOrganizers: 1,
  features: {
    culqi: true,
    transport: false,
    ai: false,
    exports: false,
    customBranding: false,
  },
};

const mockUnlimitedPlan: ResolvedPlan = {
  ...mockFreePlan,
  id: "plan-platform",
  slug: "enquiva-platform",
  name: "Plan Plataforma",
  maxAttendeesPerEvent: null,
};

describe("getEffectiveEventCapacity", () => {
  it("defaults to organizer plan maxAttendeesPerEvent (100) when event capacity is null", () => {
    const effective = getEffectiveEventCapacity(null, mockFreePlan);
    expect(effective).toBe(100);
  });

  it("defaults to organizer plan maxAttendeesPerEvent when event capacity is undefined", () => {
    const effective = getEffectiveEventCapacity(undefined, mockFreePlan);
    expect(effective).toBe(100);
  });

  it("respects event capacity when it is smaller than plan limit", () => {
    const effective = getEffectiveEventCapacity(50, mockFreePlan);
    expect(effective).toBe(50);
  });

  it("caps event capacity at plan limit when event capacity exceeds it", () => {
    const effective = getEffectiveEventCapacity(250, mockFreePlan);
    expect(effective).toBe(100);
  });

  it("allows unlimited capacity if plan has no maxAttendeesPerEvent limit", () => {
    expect(getEffectiveEventCapacity(null, mockUnlimitedPlan)).toBeNull();
    expect(getEffectiveEventCapacity(null, null)).toBeNull();
    expect(getEffectiveEventCapacity(500, mockUnlimitedPlan)).toBe(500);
  });
});

describe("getEventCapacitySnapshot with plan resolution", () => {
  it("calculates remaining and full state based on free plan effective capacity", async () => {
    const snapshot = await getEventCapacitySnapshot("event-1", null, {
      plan: mockFreePlan,
    });

    expect(snapshot.capacity).toBe(100);
    expect(snapshot.occupied).toBe(15);
    expect(snapshot.remaining).toBe(85);
    expect(snapshot.isFull).toBe(false);
  });

  it("detects full capacity when occupied meets or exceeds effective capacity", async () => {
    // If capacity was explicitly 10 and occupied is 15
    const snapshot = await getEventCapacitySnapshot("event-1", 10, {
      plan: mockFreePlan,
    });

    expect(snapshot.capacity).toBe(10);
    expect(snapshot.occupied).toBe(15);
    expect(snapshot.remaining).toBe(0);
    expect(snapshot.isFull).toBe(true);
  });
});
