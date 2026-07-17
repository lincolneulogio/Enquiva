import { describe, expect, it } from "vitest";
import {
  canClaimDailyAutoRenewal,
  canClaimGatewayOperation,
  decideGatewayIdentity,
  utcDayStart,
} from "./financial-operation-policy";

describe("financial operation claim and idempotency policy", () => {
  it("uses UTC day boundaries for auto-renew claims", () => {
    const now = new Date("2026-07-16T00:00:01.000Z");
    expect(utcDayStart(now)).toEqual(new Date("2026-07-16T00:00:00.000Z"));
    expect(canClaimDailyAutoRenewal(null, now)).toBe(true);
    expect(canClaimDailyAutoRenewal(new Date("2026-07-15T23:59:59.999Z"), now)).toBe(true);
    expect(canClaimDailyAutoRenewal(new Date("2026-07-16T00:00:00.000Z"), now)).toBe(false);
  });

  it("claims a gateway operation only for its owner and a non-processing payment", () => {
    const claim = {
      paymentUserId: "user-a",
      requestingUserId: "user-a",
      paymentStatus: "pending",
      gatewayStatus: null,
    };
    expect(canClaimGatewayOperation(claim)).toBe(true);
    expect(canClaimGatewayOperation({ ...claim, requestingUserId: "user-b" })).toBe(false);
    expect(canClaimGatewayOperation({ ...claim, paymentStatus: "approved" })).toBe(false);
    expect(canClaimGatewayOperation({ ...claim, gatewayStatus: "charge_processing" })).toBe(false);
    expect(canClaimGatewayOperation({ ...claim, gatewayStatus: "order_processing" })).toBe(false);
  });

  it("distinguishes replay from conflicting external identities", () => {
    expect(
      decideGatewayIdentity({
        paymentApproved: true,
        currentExternalId: "charge-a",
        incomingExternalId: "charge-a",
        externalIdClaimedByOtherPayment: false,
      }),
    ).toEqual({ kind: "idempotent" });
    expect(
      decideGatewayIdentity({
        paymentApproved: true,
        currentExternalId: "charge-a",
        incomingExternalId: "charge-b",
        externalIdClaimedByOtherPayment: false,
      }),
    ).toEqual({
      kind: "reject",
      reason: "payment_approved_with_other_external_id",
    });
    expect(
      decideGatewayIdentity({
        paymentApproved: false,
        currentExternalId: null,
        incomingExternalId: "charge-a",
        externalIdClaimedByOtherPayment: true,
      }),
    ).toEqual({ kind: "reject", reason: "external_id_claimed_by_other_payment" });
  });
});
