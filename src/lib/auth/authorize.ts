import { getEffectivePermissionsForRole } from "./effective-permissions";
import { resolveAuthorizationActor, type AuthorizationActor } from "./actor";
import { decideAuthorization, type AuthorizationDecision } from "./authorize-decision";
import { scheduleAuthorizationAudit } from "./authorize-audit";
import type { AuthResource } from "./authorize-types";
import type { Permission } from "./rbac";

export type { AuthResource, AuthResourceType } from "./authorize-types";
export type { AuthorizationActor } from "./actor";
export type { AuthorizationDecision } from "./authorize-decision";

export class PermissionError extends Error {
  code = "PERMISSION_DENIED";

  constructor(message = "No tienes permiso para realizar esta acción.") {
    super(message);
    this.name = "PermissionError";
  }
}

export type AuthorizeInput = {
  user: { id: string; role?: string | null; name?: string | null };
  permission?: Permission;
  permissions?: readonly Permission[];
  resource?: AuthResource;
  message?: string;
  audit?: boolean;
};

export type AuthorizeSuccess = {
  allowed: true;
  actor: AuthorizationActor;
  matchedPermission: Permission;
};

function requestedPermissions(input: AuthorizeInput): Permission[] {
  if (input.permissions && input.permissions.length > 0) {
    return [...input.permissions];
  }
  if (input.permission) return [input.permission];
  return [];
}

export async function authorize(input: AuthorizeInput): Promise<AuthorizeSuccess> {
  const requested = requestedPermissions(input);
  const actor = await resolveAuthorizationActor(input.user.id, input.user.role);
  const auditActor = {
    ...actor,
    name: input.user.name ?? actor.name,
  };

  const grantedList = await getEffectivePermissionsForRole(actor.role);
  const decision = decideAuthorization({
    actor,
    granted: new Set(grantedList),
    requested,
    resource: input.resource,
  });

  if (input.audit !== false) {
    scheduleAuthorizationAudit({
      actor: auditActor,
      allowed: decision.allowed,
      permissions: requested,
      reason: decision.reason,
      resource: input.resource,
    });
  }

  if (!decision.allowed) {
    throw new PermissionError(input.message ?? decision.reason);
  }

  return {
    allowed: true,
    actor,
    matchedPermission: decision.matchedPermission,
  };
}

export async function canAuthorize(input: AuthorizeInput): Promise<boolean> {
  try {
    await authorize({ ...input, audit: false });
    return true;
  } catch (error) {
    if (error instanceof PermissionError) return false;
    throw error;
  }
}
