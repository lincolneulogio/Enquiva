import { describe, expect, it } from "vitest";
import { canAccessDashboardPath } from "./dashboard-permission-gates";

describe("dashboard permission gates", () => {
  it("oculta analítica del organizador si se revoca el permiso", () => {
    expect(
      canAccessDashboardPath("/organizer/analytics", ["events:create", "events:update:own"]),
    ).toBe(false);
    expect(
      canAccessDashboardPath("/organizer/analytics", ["analytics:view:own"]),
    ).toBe(true);
  });

  it("exige check-in de entidad en el scanner", () => {
    expect(canAccessDashboardPath("/scanner/scan", ["registrations:view:own"])).toBe(false);
    expect(canAccessDashboardPath("/scanner/scan", ["attendees:checkin:org"])).toBe(true);
  });

  it("permite eventos inscritos al admin de entidad", () => {
    expect(
      canAccessDashboardPath("/admin/registered-events", ["registrations:view:org"]),
    ).toBe(true);
    expect(canAccessDashboardPath("/admin/registered-events", ["events:create"])).toBe(false);
  });

  it("exige check-in para escanear desde el panel de organizador o admin", () => {
    expect(canAccessDashboardPath("/organizer/scan", ["attendees:checkin:own"])).toBe(true);
    expect(canAccessDashboardPath("/admin/scan", ["attendees:checkin:org"])).toBe(true);
  });

  it("restringe la gestión de categorías exclusivamente a categories:manage:platform", () => {
    // Admin con permisos de entidad no puede acceder
    expect(
      canAccessDashboardPath("/admin/categories", ["events:create", "analytics:view:org"]),
    ).toBe(false);
    // Superadmin con categories:manage:platform sí puede acceder
    expect(
      canAccessDashboardPath("/superadmin/categories", ["categories:manage:platform"]),
    ).toBe(true);
  });
});
