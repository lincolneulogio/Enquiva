import { runBackground } from "@/lib/background";
import { logAdminAction } from "@/lib/analytics/log-admin-action";
import type { Permission } from "./rbac";
import type { AuthorizationActor } from "./actor";
import type { AuthResource } from "./authorize-types";

export function scheduleAuthorizationAudit(input: {
  actor: AuthorizationActor;
  allowed: boolean;
  permissions: readonly Permission[];
  reason: string;
  resource?: AuthResource;
}) {
  if (input.allowed && !input.resource?.id) return;

  const permissionList = input.permissions.join(",");
  const org = input.actor.organizationId ?? input.resource?.organizationId ?? "none";
  const entityId = input.resource?.id ?? input.actor.id;
  const entityType = input.resource?.type ?? "authorization";

  runBackground(async () => {
    await logAdminAction({
      actorId: input.actor.id,
      actorName: input.actor.name,
      action: input.allowed ? "authorization.allow" : "authorization.deny",
      entityType,
      entityId,
      details: [
        `permissions=${permissionList}`,
        `org=${org}`,
        `role=${input.actor.role}`,
        `reason=${input.reason}`,
      ].join("; "),
    });
  });
}
