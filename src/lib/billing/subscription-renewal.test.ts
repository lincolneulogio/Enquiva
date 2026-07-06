import { describe, expect, it } from "vitest";
import {
  AUTO_RENEW_BLOCK_AFTER_DAYS,
  AUTO_RENEW_RETRY_DAYS,
  MANUAL_PAYMENT_GRACE_DAYS,
} from "@/lib/billing/subscription-renewal.service";

describe("subscription-renewal constants", () => {
  it("defines auto-renew retry schedule", () => {
    expect(AUTO_RENEW_RETRY_DAYS).toEqual([0, 1, 3, 5]);
    expect(AUTO_RENEW_RETRY_DAYS[0]).toBe(0);
  });

  it("defines grace and block windows", () => {
    expect(MANUAL_PAYMENT_GRACE_DAYS).toBeGreaterThan(0);
    expect(AUTO_RENEW_BLOCK_AFTER_DAYS).toBeGreaterThanOrEqual(
      AUTO_RENEW_RETRY_DAYS[AUTO_RENEW_RETRY_DAYS.length - 1],
    );
  });
});
