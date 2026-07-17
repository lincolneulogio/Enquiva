export function utcDayStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function canClaimDailyAutoRenewal(
  lastAttemptAt: Date | null | undefined,
  now: Date,
): boolean {
  return !lastAttemptAt || lastAttemptAt.getTime() < utcDayStart(now).getTime();
}

export function canClaimGatewayOperation(input: {
  paymentUserId: string;
  requestingUserId: string;
  paymentStatus: string;
  gatewayStatus: string | null;
}): boolean {
  return (
    input.paymentUserId === input.requestingUserId &&
    input.paymentStatus !== "approved" &&
    input.gatewayStatus !== "charge_processing" &&
    input.gatewayStatus !== "order_processing"
  );
}

export type GatewayIdentityDecision =
  | { kind: "proceed" }
  | { kind: "idempotent" }
  | {
      kind: "reject";
      reason:
        | "external_id_claimed_by_other_payment"
        | "payment_approved_with_other_external_id";
    };

export function decideGatewayIdentity(input: {
  paymentApproved: boolean;
  currentExternalId: string | null;
  incomingExternalId: string;
  externalIdClaimedByOtherPayment: boolean;
}): GatewayIdentityDecision {
  if (input.paymentApproved) {
    return input.currentExternalId && input.currentExternalId !== input.incomingExternalId
      ? { kind: "reject", reason: "payment_approved_with_other_external_id" }
      : { kind: "idempotent" };
  }
  if (input.externalIdClaimedByOtherPayment) {
    return { kind: "reject", reason: "external_id_claimed_by_other_payment" };
  }
  return { kind: "proceed" };
}
