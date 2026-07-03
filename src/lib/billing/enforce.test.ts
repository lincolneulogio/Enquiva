import { describe, expect, it } from "vitest";
import {
  getPlatformFee,
  planIncludesBroadcasts,
  planIncludesFeature,
  PlanLimitError,
} from "@/lib/billing/enforce";
import type { ResolvedPlan } from "@/lib/billing/types";

const basePlan: ResolvedPlan = {
  id: "p1",
  slug: "pro",
  name: "Pro",
  description: null,
  priceMonthly: 49,
  currency: "PEN",
  maxActiveEvents: 5,
  maxAttendeesPerEvent: 200,
  commissionPercent: 5,
  maxBroadcastsPerMonth: 10,
  maxOrganizers: null,
  features: {
    culqi: true,
    transport: true,
    ai: true,
    exports: true,
    customBranding: false,
  },
};

describe("billing enforce", () => {
  it("calculates platform fee from commission percent", () => {
    expect(getPlatformFee(100, basePlan)).toBe(5);
    expect(getPlatformFee(0, basePlan)).toBe(0);
  });

  it("detects broadcast capability by plan limits", () => {
    expect(planIncludesBroadcasts(basePlan)).toBe(true);
    expect(planIncludesBroadcasts({ ...basePlan, maxBroadcastsPerMonth: 0 })).toBe(false);
    expect(planIncludesBroadcasts({ ...basePlan, maxBroadcastsPerMonth: null })).toBe(true);
    expect(planIncludesBroadcasts({ ...basePlan, maxBroadcastsPerMonth: 0 }, true)).toBe(true);
  });

  it("checks individual plan features", () => {
    expect(planIncludesFeature(basePlan, "ai")).toBe(true);
    expect(planIncludesFeature({ ...basePlan, features: { ...basePlan.features, ai: false } }, "ai")).toBe(
      false,
    );
    expect(planIncludesFeature(basePlan, "ai", true)).toBe(true);
  });

  it("exposes plan limit error metadata", () => {
    const err = new PlanLimitError("Límite alcanzado");
    expect(err.code).toBe("PLAN_LIMIT");
    expect(err.upgradeHint).toContain("/organizer/billing");
  });
});
