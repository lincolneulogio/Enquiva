import { describe, it, expect } from "vitest";
import { isAuthPath } from "./EventSpotlightBanner";

describe("isAuthPath helper", () => {
  it("identifies standard auth paths as true", () => {
    expect(isAuthPath("/login")).toBe(true);
    expect(isAuthPath("/login/")).toBe(true);
    expect(isAuthPath("/login?redirect=%2Fevents")).toBe(true);
    expect(isAuthPath("/register")).toBe(true);
    expect(isAuthPath("/forgot-password")).toBe(true);
    expect(isAuthPath("/two-factor")).toBe(true);
  });

  it("identifies superadmin auth paths as true", () => {
    expect(isAuthPath("/superadmin/login")).toBe(true);
    expect(isAuthPath("/superadmin/register")).toBe(true);
  });

  it("identifies tokenized auth paths (reset-password and verify-account) as true", () => {
    expect(isAuthPath("/reset-password")).toBe(true);
    expect(isAuthPath("/reset-password/sample-token-123")).toBe(true);
    expect(isAuthPath("/verify-account")).toBe(true);
    expect(isAuthPath("/verify-account?token=xyz")).toBe(true);
  });

  it("identifies non-auth paths as false", () => {
    expect(isAuthPath("/")).toBe(false);
    expect(isAuthPath("/events")).toBe(false);
    expect(isAuthPath("/events/congreso-2026")).toBe(false);
    expect(isAuthPath("/pricing")).toBe(false);
    expect(isAuthPath("/organizer")).toBe(false);
    expect(isAuthPath("/admin")).toBe(false);
    expect(isAuthPath("/member")).toBe(false);
    expect(isAuthPath(null)).toBe(false);
    expect(isAuthPath(undefined)).toBe(false);
  });
});
