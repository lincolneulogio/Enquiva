import type { AuthorizationActor } from "./actor";
import type { AuthResource } from "./authorize-types";
import { getPermissionScope, type Permission } from "./rbac";

export type AuthorizationDecision =
  | {
      allowed: true;
      matchedPermission: Permission;
      reason: string;
    }
  | {
      allowed: false;
      reason: string;
      code: "PERMISSION_DENIED" | "TENANT_DENIED" | "OWNERSHIP_DENIED";
    };

function resourceOwnedByActor(actor: AuthorizationActor, resource: AuthResource): boolean {
  return (
    (Boolean(resource.ownerUserId) && resource.ownerUserId === actor.id) ||
    (Boolean(resource.organizerId) && resource.organizerId === actor.id)
  );
}

function resourceInActorOrg(actor: AuthorizationActor, resource: AuthResource): boolean {
  return Boolean(
    actor.organizationId &&
      resource.organizationId &&
      actor.organizationId === resource.organizationId,
  );
}

type DenialCode = Extract<AuthorizationDecision, { allowed: false }>["code"];

export function decideAuthorization(input: {
  actor: AuthorizationActor;
  granted: ReadonlySet<Permission>;
  requested: readonly Permission[];
  resource?: AuthResource;
}): AuthorizationDecision {
  if (input.requested.length === 0) {
    return { allowed: false, reason: "No se indicó ningún permiso", code: "PERMISSION_DENIED" };
  }

  if (input.actor.role === "super_admin") {
    return {
      allowed: true,
      matchedPermission: input.requested[0],
      reason: "Rol de plataforma",
    };
  }

  let lastCode: DenialCode = "PERMISSION_DENIED";
  let lastReason = "El rol no tiene el permiso solicitado";

  for (const permission of input.requested) {
    if (!input.granted.has(permission)) {
      if (lastCode === "PERMISSION_DENIED") {
        lastReason = `Sin permiso ${permission}`;
      }
      continue;
    }

    const scope = getPermissionScope(permission);
    if (!input.resource || scope === "unscoped" || scope === "platform") {
      return {
        allowed: true,
        matchedPermission: permission,
        reason: `Permiso ${permission}`,
      };
    }

    if (scope === "org") {
      if (resourceInActorOrg(input.actor, input.resource)) {
        return {
          allowed: true,
          matchedPermission: permission,
          reason: `Permiso ${permission} en la entidad`,
        };
      }
      lastCode = "TENANT_DENIED";
      lastReason = "El recurso pertenece a otra entidad";
      continue;
    }

    if (scope === "own") {
      if (resourceOwnedByActor(input.actor, input.resource)) {
        return {
          allowed: true,
          matchedPermission: permission,
          reason: `Permiso ${permission} sobre recurso propio`,
        };
      }
      lastCode = "OWNERSHIP_DENIED";
      lastReason = "El recurso no te pertenece";
    }
  }

  return { allowed: false, reason: lastReason, code: lastCode };
}
