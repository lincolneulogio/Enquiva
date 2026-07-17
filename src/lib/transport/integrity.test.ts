import { describe, expect, it } from "vitest";
import { routeMatchesRegistration } from "./integrity";

describe("routeMatchesRegistration", () => {
  it("accepts only the same event and owner", () => {
    const registration = { eventId: "event-1", userId: "user-1" };
    expect(routeMatchesRegistration("event-1", registration, "user-1")).toBe(true);
    expect(routeMatchesRegistration("event-2", registration, "user-1")).toBe(false);
    expect(routeMatchesRegistration("event-1", registration, "user-2")).toBe(false);
  });

  it("rejects a missing registration", () => {
    expect(routeMatchesRegistration("event-1", null, "user-1")).toBe(false);
    expect(routeMatchesRegistration("event-1", undefined, "user-1")).toBe(false);
  });

  it("does not accept empty identifiers as matching ownership", () => {
    expect(
      routeMatchesRegistration("", { eventId: "", userId: "" }, ""),
    ).toBe(false);
  });
});
