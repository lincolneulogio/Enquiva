import { describe, expect, it } from "vitest";
import {
  addBillingMonth,
  decidePlanChangeTiming,
  purchasedPeriodEnd,
} from "./plan-change-policy";

const now = new Date("2026-04-19T12:00:00.000Z");
const currentEnd = new Date("2026-05-11T12:00:00.000Z");

describe("plan change policy", () => {
  it("activates a paid upgrade immediately", () => {
    expect(
      decidePlanChangeTiming({
        currentPrice: 50,
        targetPrice: 100,
        currentPlanId: "basic",
        targetPlanId: "pro",
        currentStatus: "active",
        currentPeriodEnd: currentEnd,
        now,
      }).timing,
    ).toBe("immediate");
  });

  it("schedules a downgrade at the current period end", () => {
    expect(
      decidePlanChangeTiming({
        currentPrice: 100,
        targetPrice: 50,
        currentPlanId: "pro",
        targetPlanId: "basic",
        currentStatus: "active",
        currentPeriodEnd: currentEnd,
        now,
      }).timing,
    ).toBe("scheduled");
  });

  it("adds a fully paid month after the current paid period", () => {
    expect(
      purchasedPeriodEnd({
        currentPeriodEnd: currentEnd,
        now,
        hasActivePaidPeriod: true,
        paymentReceived: true,
      }).toISOString(),
    ).toBe("2026-06-11T12:00:00.000Z");
  });

  it("clamps end-of-month billing anchors", () => {
    expect(addBillingMonth(new Date("2026-01-31T12:00:00.000Z")).toISOString()).toBe(
      "2026-02-28T12:00:00.000Z",
    );
  });
});
