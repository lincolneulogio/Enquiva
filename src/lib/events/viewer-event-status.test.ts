import { describe, expect, it } from "vitest";
import { resolveViewerEventStatus } from "./viewer-event-status";

const now = new Date("2026-07-17T12:00:00.000Z");

function row(overrides: Partial<{
  registrationStatus: string;
  holdExpiresAt: Date | null;
  paymentStatus: string | null;
}> = {}) {
  return {
    eventId: "event-1",
    registrationStatus: "registered",
    holdExpiresAt: null,
    paymentStatus: null,
    ...overrides,
  };
}

describe("viewer event status", () => {
  it("distinguishes users without registration", () => {
    expect(resolveViewerEventStatus([], now)).toBe("not_registered");
  });

  it("shows a pending paid-event registration as reserved", () => {
    expect(
      resolveViewerEventStatus(
        [
          row({
            paymentStatus: "pending",
            holdExpiresAt: new Date("2026-07-17T12:30:00.000Z"),
          }),
        ],
        now,
      ),
    ).toBe("reserved");
  });

  it("detects expired reservations", () => {
    expect(
      resolveViewerEventStatus(
        [
          row({
            paymentStatus: "pending",
            holdExpiresAt: new Date("2026-07-17T11:59:59.000Z"),
          }),
        ],
        now,
      ),
    ).toBe("reservation_expired");
  });

  it("prioritizes any approved payment over pending attempts", () => {
    expect(
      resolveViewerEventStatus(
        [row({ paymentStatus: "pending" }), row({ paymentStatus: "approved" })],
        now,
      ),
    ).toBe("paid");
  });

  it("preserves waitlist and check-in states", () => {
    expect(
      resolveViewerEventStatus(
        [row({ registrationStatus: "waitlisted" })],
        now,
      ),
    ).toBe("waitlisted");
    expect(
      resolveViewerEventStatus(
        [row({ registrationStatus: "checked_in", paymentStatus: "approved" })],
        now,
      ),
    ).toBe("checked_in");
  });
});
