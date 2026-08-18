import { describe, expect, it } from "vitest";
import {
  appRoleForOrganizationContext,
  appRoleFromMembershipRole,
  shouldApplyMembershipToUserRecord,
} from "./membership-role";

describe("membership-role", () => {
  it("mapea owner a admin de entidad, no a superadmin", () => {
    expect(appRoleFromMembershipRole("owner")).toBe("admin");
    expect(appRoleFromMembershipRole("organizer")).toBe("organizer");
    expect(appRoleFromMembershipRole("scanner")).toBe("scanner");
    expect(appRoleFromMembershipRole("member")).toBe("member");
  });

  it("el dueño de la entidad es admin en ese contexto aunque la membresía diga organizer", () => {
    expect(
      appRoleForOrganizationContext({
        userId: "user-1",
        organizationOwnerId: "user-1",
        membershipRole: "organizer",
      }),
    ).toBe("admin");
    expect(
      appRoleForOrganizationContext({
        userId: "user-1",
        organizationOwnerId: "owner-2",
        membershipRole: "organizer",
      }),
    ).toBe("organizer");
  });

  it("no pisa el contexto activo al añadir membresía en otra entidad", () => {
    expect(shouldApplyMembershipToUserRecord("org-a", "org-b")).toBe(false);
    expect(shouldApplyMembershipToUserRecord("org-a", "org-a")).toBe(true);
    expect(shouldApplyMembershipToUserRecord(null, "org-b")).toBe(true);
  });
});
