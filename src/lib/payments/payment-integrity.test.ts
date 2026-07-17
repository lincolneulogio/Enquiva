import { describe, expect, it } from "vitest";
import { getPaymentIntegrityFailure } from "./payment-integrity";

const now = new Date("2026-07-16T12:00:00.000Z");
const payment = { registrationId: "reg-1", userId: "user-1", amount: "25.00" };
const registration = {
  id: "reg-1",
  userId: "user-1",
  eventId: "event-1",
  status: "registered",
  holdExpiresAt: new Date("2026-07-16T12:30:00.000Z"),
};
const event = {
  id: "event-1",
  status: "published",
  date: new Date("2026-07-17T12:00:00.000Z"),
};

describe("getPaymentIntegrityFailure", () => {
  it("accepts a current registration, event and hold", () => {
    expect(getPaymentIntegrityFailure(payment, registration, event, now)).toBeNull();
  });

  it("rejects a payment transported to another registration or event", () => {
    expect(
      getPaymentIntegrityFailure(payment, { ...registration, eventId: "event-2" }, event, now),
    ).toBe("payment_registration_mismatch");
  });

  it("rejects expired holds and inactive registrations", () => {
    expect(
      getPaymentIntegrityFailure(
        payment,
        { ...registration, holdExpiresAt: new Date("2026-07-16T11:59:59.000Z") },
        event,
        now,
      ),
    ).toBe("registration_hold_expired");
    expect(
      getPaymentIntegrityFailure(payment, { ...registration, status: "cancelled" }, event, now),
    ).toBe("registration_inactive");
  });

  it("rejects cancelled or expired events", () => {
    expect(
      getPaymentIntegrityFailure(payment, registration, { ...event, status: "cancelled" }, now),
    ).toBe("event_inactive");
    expect(
      getPaymentIntegrityFailure(
        payment,
        registration,
        { ...event, date: new Date("2026-07-16T11:00:00.000Z") },
        now,
      ),
    ).toBe("event_expired");
  });
});
