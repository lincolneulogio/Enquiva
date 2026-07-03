import { describe, expect, it } from "vitest";
import {
  assertScopeAccess,
  buildFileName,
  normalizeFilterValue,
  parseFromDate,
  parseToDate,
} from "@/actions/exports/helpers";
import type { SessionUser } from "@/actions/exports/types";

const organizer: SessionUser = { id: "u1", role: "organizer" };
const admin: SessionUser = { id: "a1", role: "admin" };

describe("exports helpers", () => {
  it("assertScopeAccess allows matching roles", () => {
    expect(() => assertScopeAccess(organizer, "organizer")).not.toThrow();
    expect(() => assertScopeAccess(admin, "admin")).not.toThrow();
  });

  it("assertScopeAccess rejects member for staff scopes", () => {
    const member = { ...organizer, role: "member" as const };
    expect(() => assertScopeAccess(member, "organizer")).toThrow("Forbidden");
    expect(() => assertScopeAccess(member, "admin")).toThrow("Forbidden");
  });

  it("normalizes filter values", () => {
    expect(normalizeFilterValue("all")).toBeNull();
    expect(normalizeFilterValue(undefined)).toBeNull();
    expect(normalizeFilterValue("published")).toBe("published");
  });

  it("builds safe export filenames", () => {
    expect(buildFileName(["Events", "2026-01"])).toBe("events-2026-01");
    expect(buildFileName(["Pagos", null, "final"])).toBe("pagos-final");
  });

  it("parses export date boundaries", () => {
    const from = parseFromDate("2026-03-01");
    const to = parseToDate("2026-03-31");
    expect(from?.getHours()).toBe(0);
    expect(to?.getHours()).toBe(23);
  });
});
