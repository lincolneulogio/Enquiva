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
    expect(shouldRefreshRealtimePath("/organizer/events", { resource: "payments" })).toBe(false);
    expect(
      shouldRefreshRealtimePath("/admin/registrations", {
        resource: ["registrations", "attendees"],
      }),
    ).toBe(true);
  });
});
