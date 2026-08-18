import type { AppRole, Permission } from "@/lib/auth/rbac";

export const CHAT_TOOL_NAMES = [
  "getPlatformKnowledge",
  "searchEvents",
  "getPaymentStatus",
  "getMyPlanBilling",
  "getMyNextEvent",
  "getMyTickets",
  "getEventStats",
  "getEventRoutes",
  "getCheckInStats",
  "getTransportSeats",
  "draftBroadcast",
  "getRegistrationsList",
  "previewMassNotification",
  "sendMassNotification",
  "getUsersList",
  "getAuditLogs",
] as const;

export type ChatToolName = (typeof CHAT_TOOL_NAMES)[number];

const ALWAYS_ON: readonly ChatToolName[] = [
  "getPlatformKnowledge",
  "searchEvents",
  "getMyNextEvent",
];

function hasAny(granted: ReadonlySet<Permission>, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => granted.has(permission));
}

/**
 * Qué tools del copilot se habilitan según la misma matriz que authorize().
 * El SQL de tenant vive en `scope.ts`; esto solo cierra el menú de tools.
 */
export function enabledChatTools(
  granted: ReadonlySet<Permission>,
  role: AppRole,
): Set<ChatToolName> {
  const enabled = new Set<ChatToolName>(ALWAYS_ON);

  if (hasAny(granted, ["tickets:view:own"])) {
    enabled.add("getMyTickets");
  }

  if (hasAny(granted, ["payments:view:own", "payments:view:org"])) {
    enabled.add("getPaymentStatus");
  }

  if (role !== "scanner" && hasAny(granted, ["events:create", "platform:billing:view", "payments:view:own"])) {
    enabled.add("getMyPlanBilling");
  }

  if (hasAny(granted, ["analytics:view:org", "analytics:view:own"])) {
    enabled.add("getEventStats");
  }

  if (hasAny(granted, ["transport:manage:org", "transport:manage:own"])) {
    enabled.add("getEventRoutes");
    enabled.add("getTransportSeats");
  }

  if (hasAny(granted, ["attendees:checkin:org", "attendees:checkin:own"])) {
    enabled.add("getCheckInStats");
  }

  if (
    hasAny(granted, ["registrations:view:org"]) ||
    (role !== "member" && hasAny(granted, ["registrations:view:own"]))
  ) {
    enabled.add("getRegistrationsList");
  }

  if (hasAny(granted, ["broadcasts:send:org", "broadcasts:send:own"])) {
    enabled.add("draftBroadcast");
    enabled.add("previewMassNotification");
    enabled.add("sendMassNotification");
  }

  if (hasAny(granted, ["users:manage:org", "users:manage:platform"])) {
    enabled.add("getUsersList");
  }

  if (hasAny(granted, ["permissions:view"]) || role === "admin") {
    enabled.add("getAuditLogs");
  }

  return enabled;
}
