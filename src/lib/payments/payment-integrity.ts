export type PayableRegistration = {
  id: string;
  userId: string | null;
  eventId: string;
  status: string;
  holdExpiresAt: Date | null;
};

export type PayableEvent = {
  id: string;
  status: string;
  date: Date;
};

export type PayablePayment = {
  registrationId: string;
  userId: string;
  amount: string | number;
};

export type PaymentIntegrityFailure =
  | "payment_registration_mismatch"
  | "payment_user_mismatch"
  | "registration_inactive"
  | "registration_hold_expired"
  | "event_inactive"
  | "event_expired"
  | "invalid_amount";

export function getPaymentIntegrityFailure(
  payment: PayablePayment,
  registration: PayableRegistration,
  event: PayableEvent,
  now = new Date(),
): PaymentIntegrityFailure | null {
  if (payment.registrationId !== registration.id || registration.eventId !== event.id) {
    return "payment_registration_mismatch";
  }
  if (payment.userId !== registration.userId) return "payment_user_mismatch";
  if (registration.status !== "registered") return "registration_inactive";
  if (registration.holdExpiresAt && registration.holdExpiresAt.getTime() <= now.getTime()) {
    return "registration_hold_expired";
  }
  if (event.status !== "published") return "event_inactive";
  if (event.date.getTime() <= now.getTime()) return "event_expired";

  const amount = Number(payment.amount);
  if (!Number.isFinite(amount) || amount <= 0) return "invalid_amount";
  return null;
}

export function assertPaymentCanBeApproved(
  payment: PayablePayment,
  registration: PayableRegistration,
  event: PayableEvent,
  now = new Date(),
) {
  const failure = getPaymentIntegrityFailure(payment, registration, event, now);
  if (failure) {
    throw new Error(`PAYMENT_INTEGRITY:${failure}`);
  }
}
