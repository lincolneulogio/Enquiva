export type CheckoutStepId = "cart" | "pay" | "validate" | "confirmed";

/** Derive checkout stepper step from payment state (server- and client-safe). */
export function checkoutStepFromPaymentStatus(opts: {
  approved: boolean;
  pendingReview: boolean;
}): CheckoutStepId {
  if (opts.approved) return "confirmed";
  if (opts.pendingReview) return "validate";
  return "pay";
}
