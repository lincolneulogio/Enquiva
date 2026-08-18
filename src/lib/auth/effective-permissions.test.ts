import { describe, expect, it } from "vitest";
import { applyOverrides } from "@/lib/auth/effective-permissions";
import { getDefaultPermissionMatrix, PERMISSIONS } from "@/lib/auth/rbac";

describe("RBAC applyOverrides", () => {
  it("applies role overrides without touching super_admin", () => {
    const matrix = getDefaultPermissionMatrix();
    const before = matrix.member["events:create"];

    applyOverrides(matrix, [
      { roleName: "member", permission: "events:create", allowed: !before },
      { roleName: "super_admin", permission: "events:create", allowed: false },
    ]);

    expect(matrix.member["events:create"]).toBe(!before);
    for (const permission of PERMISSIONS) {
      expect(matrix.super_admin[permission]).toBe(true);
    }
  });

  it("ignores unknown permissions", () => {
    const matrix = getDefaultPermissionMatrix();
    applyOverrides(matrix, [
      { roleName: "organizer", permission: "not:a:real:permission", allowed: true },
    ]);
    expect(matrix.organizer["events:create"]).toBe(
      getDefaultPermissionMatrix().organizer["events:create"],
    );
  });

  it("canonicaliza aliases históricos :any al alcance :org", () => {
    const matrix = getDefaultPermissionMatrix();
    applyOverrides(matrix, [
      { roleName: "organizer", permission: "events:update:any", allowed: true },
      { roleName: "member", permission: "attendees:checkin", allowed: true },
    ]);
    expect(matrix.organizer["events:update:org"]).toBe(true);
    expect(matrix.member["attendees:checkin:org"]).toBe(true);
  });
});
