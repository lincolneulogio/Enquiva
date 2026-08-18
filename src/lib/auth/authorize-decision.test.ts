import { describe, expect, it } from "vitest";
import { decideAuthorization } from "./authorize-decision";
import type { AuthorizationActor } from "./actor";
import { getDefaultPermissionMatrix, type Permission } from "./rbac";

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";

function actor(partial: Partial<AuthorizationActor> & Pick<AuthorizationActor, "id" | "role">): AuthorizationActor {
  return {
    name: "Test",
    globalRole: partial.role,
    organizationId: null,
    membershipRole: null,
    ...partial,
  };
}

function grantedFor(role: AuthorizationActor["role"]): Set<Permission> {
  const matrix = getDefaultPermissionMatrix();
  return new Set(
    (Object.keys(matrix[role]) as Permission[]).filter((permission) => matrix[role][permission]),
  );
}

describe("decideAuthorization", () => {
  it("niega a un admin de org A mutar un evento de org B", () => {
    const decision = decideAuthorization({
      actor: actor({ id: "admin-a", role: "admin", organizationId: ORG_A }),
      granted: grantedFor("admin"),
      requested: ["events:update:org", "events:update:own"],
      resource: {
        type: "event",
        id: "event-b",
        organizationId: ORG_B,
        organizerId: "organizer-b",
      },
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.code).toBe("TENANT_DENIED");
  });

  it("permite al admin de la misma entidad actualizar el evento", () => {
    const decision = decideAuthorization({
      actor: actor({ id: "admin-a", role: "admin", organizationId: ORG_A }),
      granted: grantedFor("admin"),
      requested: ["events:update:org", "events:update:own"],
      resource: {
        type: "event",
        id: "event-a",
        organizationId: ORG_A,
        organizerId: "organizer-a",
      },
    });
    expect(decision.allowed).toBe(true);
  });

  it("niega al organizador aprobar un pago de un evento ajeno", () => {
    const decision = decideAuthorization({
      actor: actor({ id: "organizer-a", role: "organizer" }),
      granted: grantedFor("organizer"),
      requested: ["payments:update:org", "payments:update:own"],
      resource: {
        type: "payment",
        id: "pay-1",
        organizationId: ORG_A,
        organizerId: "organizer-b",
      },
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.code).toBe("OWNERSHIP_DENIED");
  });

  it("niega check-in al miembro", () => {
    const decision = decideAuthorization({
      actor: actor({ id: "member-a", role: "member" }),
      granted: grantedFor("member"),
      requested: ["attendees:checkin:org", "attendees:checkin:own"],
      resource: { type: "event", id: "event-a", organizationId: ORG_A, organizerId: "organizer-a" },
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.code).toBe("PERMISSION_DENIED");
  });

  it("niega al scanner editar un evento de su entidad", () => {
    const decision = decideAuthorization({
      actor: actor({
        id: "scanner-a",
        role: "scanner",
        organizationId: ORG_A,
        membershipRole: "scanner",
      }),
      granted: grantedFor("scanner"),
      requested: ["events:update:org", "events:update:own"],
      resource: {
        type: "event",
        id: "event-a",
        organizationId: ORG_A,
        organizerId: "organizer-a",
      },
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.code).toBe("PERMISSION_DENIED");
  });

  it("permite al scanner hacer check-in en su entidad", () => {
    const decision = decideAuthorization({
      actor: actor({
        id: "scanner-a",
        role: "scanner",
        organizationId: ORG_A,
        membershipRole: "scanner",
      }),
      granted: grantedFor("scanner"),
      requested: ["attendees:checkin:org", "attendees:checkin:own"],
      resource: {
        type: "event",
        id: "event-a",
        organizationId: ORG_A,
        organizerId: "organizer-a",
      },
    });
    expect(decision.allowed).toBe(true);
  });

  it("permite al admin ver eventos en los que se inscribió", () => {
    const decision = decideAuthorization({
      actor: actor({ id: "admin-a", role: "admin", organizationId: ORG_A }),
      granted: grantedFor("admin"),
      requested: ["tickets:view:own", "registrations:view:own", "registrations:view:org"],
    });
    expect(decision.allowed).toBe(true);
  });

  it("permite al miembro cancelar su inscripción", () => {
    const decision = decideAuthorization({
      actor: actor({ id: "member-a", role: "member" }),
      granted: grantedFor("member"),
      requested: ["registrations:cancel:own"],
      resource: {
        type: "registration",
        id: "reg-1",
        ownerUserId: "member-a",
        organizerId: "organizer-a",
        organizationId: ORG_A,
      },
    });
    expect(decision.allowed).toBe(true);
  });

  it("niega al miembro cancelar la inscripción de otra persona", () => {
    const decision = decideAuthorization({
      actor: actor({ id: "member-a", role: "member" }),
      granted: grantedFor("member"),
      requested: ["registrations:cancel:own"],
      resource: {
        type: "registration",
        id: "reg-2",
        ownerUserId: "member-b",
        organizerId: "organizer-a",
        organizationId: ORG_A,
      },
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.code).toBe("OWNERSHIP_DENIED");
  });

  it("niega al scanner hacer check-in en otra entidad", () => {
    const decision = decideAuthorization({
      actor: actor({
        id: "scanner-a",
        role: "scanner",
        organizationId: ORG_A,
        membershipRole: "scanner",
      }),
      granted: grantedFor("scanner"),
      requested: ["attendees:checkin:org", "attendees:checkin:own"],
      resource: {
        type: "event",
        id: "event-b",
        organizationId: ORG_B,
        organizerId: "organizer-b",
      },
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.code).toBe("TENANT_DENIED");
  });

  it("niega al admin el alcance de plataforma sobre usuarios", () => {
    const decision = decideAuthorization({
      actor: actor({ id: "admin-a", role: "admin", organizationId: ORG_A }),
      granted: grantedFor("admin"),
      requested: ["users:manage:platform"],
      resource: { type: "user", id: "user-1", organizationId: ORG_B },
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.code).toBe("PERMISSION_DENIED");
  });
});
