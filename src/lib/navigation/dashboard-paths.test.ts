import { describe, expect, it } from "vitest";
import {
  getStaffDashboardHome,
  mapAdminPathToSuperadmin,
  mapSuperadminPathToAdmin,
} from "@/lib/navigation/dashboard-paths";

describe("dashboard-paths", () => {
  it("routes super_admin to /superadmin home", () => {
    expect(getStaffDashboardHome("super_admin")).toBe("/superadmin");
    expect(getStaffDashboardHome("admin")).toBe("/admin");
  });

  it("maps entity-only admin paths to superadmin root", () => {
    expect(mapAdminPathToSuperadmin("/admin/onboarding")).toBe("/superadmin");
    expect(mapAdminPathToSuperadmin("/admin/team")).toBe("/superadmin");
    expect(mapAdminPathToSuperadmin("/admin/events")).toBe("/superadmin/events");
  });

  it("maps superadmin paths back to admin", () => {
    expect(mapSuperadminPathToAdmin("/superadmin/events")).toBe("/admin/events");
    expect(mapSuperadminPathToAdmin("/superadmin/users")).toBe("/admin/users");
  });
});
