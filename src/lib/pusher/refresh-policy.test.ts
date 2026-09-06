import { describe, expect, it } from "vitest";
import { shouldRefreshRealtimePath } from "./refresh-policy";

describe("realtime refresh policy", () => {
  it("limits dashboard refreshes to dashboard roots", () => {
    expect(shouldRefreshRealtimePath("/admin", { resource: "dashboard" })).toBe(true);
    expect(shouldRefreshRealtimePath("/organizer/", { resource: "dashboard" })).toBe(true);
    expect(shouldRefreshRealtimePath("/admin/events", { resource: "dashboard" })).toBe(false);
    expect(shouldRefreshRealtimePath("/member/payments", { resource: "dashboard" })).toBe(false);
  });

  it("still refreshes pages matching a specific resource", () => {
    expect(shouldRefreshRealtimePath("/organizer/events", { resource: "events" })).toBe(true);
    expect(shouldRefreshRealtimePath("/organizer", { resource: "events" })).toBe(true);
    expect(shouldRefreshRealtimePath("/events", { resource: "events" })).toBe(true);
    expect(shouldRefreshRealtimePath("/events/mi-evento-2026", { resource: "events" })).toBe(true);
    expect(shouldRefreshRealtimePath("/organizer/events", { resource: "payments" })).toBe(false);
    expect(
      shouldRefreshRealtimePath("/admin/registrations", {
        resource: ["registrations", "attendees"],
      }),
    ).toBe(true);
    expect(
      shouldRefreshRealtimePath("/admin/transport", { resource: "transport" }),
    ).toBe(true);
    expect(
      shouldRefreshRealtimePath("/member/tickets", { resource: "registrations" }),
    ).toBe(true);
  });
});
