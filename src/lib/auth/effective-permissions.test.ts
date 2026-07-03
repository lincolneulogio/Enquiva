import { describe, expect, it } from "vitest";
import { applyOverrides } from "@/lib/auth/effective-permissions";
import { getDefaultPermissionMatrix, PERMISSIONS } from "@/lib/auth/rbac";

describe("effective-permissions", () => {
  it("applies permission overrides for non-super_admin roles", () => {
    const matrix = getDefaultPermissionMatrix();
    expect(matrix.admin["users:manage"]).toBe(true);

    applyOverrides(matrix, [
      { roleName: "admin", permission: "users:manage", allowed: false },
    ]);

    expect(matrix.admin["users:manage"]).toBe(false);
    expect(matrix.super_admin["users:manage"]).toBe(true);
  });

  it("ignores invalid permissions and super_admin overrides", () => {
    const matrix = getDefaultPermissionMatrix();

    applyOverrides(matrix, [
      { roleName: "super_admin", permission: "users:manage", allowed: false },
      { roleName: "organizer", permission: "not:a:permission", allowed: true },
    ]);

    expect(matrix.super_admin["users:manage"]).toBe(true);
    for (const permission of PERMISSIONS) {
      expect(matrix.organizer[permission]).toBe(
        getDefaultPermissionMatrix().organizer[permission],
      );
    }
  });

  it("restores organizer-specific grants via override", () => {
    const matrix = getDefaultPermissionMatrix();
    expect(matrix.organizer["payments:view:own"]).toBe(true);

    applyOverrides(matrix, [
      { roleName: "organizer", permission: "payments:view:own", allowed: false },
    ]);

    expect(matrix.organizer["payments:view:own"]).toBe(false);
  });
});
