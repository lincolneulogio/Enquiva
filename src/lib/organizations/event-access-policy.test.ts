import { describe, expect, it } from "vitest";
import { canAccessEventRealtime } from "./event-access-policy";

const event = {
  organizerId: "organizer-a",
  organizationId: "org-a",
  registeredUserIds: ["member-a"],
};

describe("event realtime access policy", () => {
  it("prevents cross-tenant admin and organizer access", () => {
    expect(
      canAccessEventRealtime(event, {
        id: "admin-a",
        role: "admin",
        organizationId: "org-a",
      }),
    ).toBe(true);
    expect(
      canAccessEventRealtime(event, {
        id: "admin-b",
        role: "admin",
        organizationId: "org-b",
      }),
    ).toBe(false);
    expect(
      canAccessEventRealtime(event, {
        id: "organizer-b",
        role: "organizer",
      }),
    ).toBe(false);
  });

  it("allows only registered members while preserving platform access", () => {
    expect(canAccessEventRealtime(event, { id: "member-a", role: "member" })).toBe(true);
    expect(canAccessEventRealtime(event, { id: "member-b", role: "member" })).toBe(false);
    expect(canAccessEventRealtime(event, { id: "root", role: "super_admin" })).toBe(true);
  });

  it("denies unassigned admins even when the event has no organization", () => {
    expect(
      canAccessEventRealtime(
        { ...event, organizationId: null },
        { id: "admin", role: "admin", organizationId: null },
      ),
    ).toBe(false);
  });
});
