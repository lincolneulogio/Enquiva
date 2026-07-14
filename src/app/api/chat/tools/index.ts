import { getMyTickets } from "./my-tickets";
import { createSearchEvents } from "./search-events";
import { createGetEventStats } from "./event-stats";
import { createGetEventRoutes } from "./event-routes";
import { createPreviewMassNotification, createSendMassNotification } from "./mass-notification";
import { createGetAuditLogs } from "./audit-logs";
import { createGetUsersList } from "./users";
import { createGetRegistrationsList } from "./registrations";
import { createGetPlatformKnowledge } from "./platform-knowledge";
import { hasEffectivePermission } from "@/lib/auth/effective-permissions";
import { resolveChatToolScope, type ChatToolScope } from "./scope";
import { normalizeChatTool } from "./chat-tool";
import type { AppRole } from "@/lib/auth/rbac";

function addTool(tools: Record<string, unknown>, name: string, raw: Parameters<typeof normalizeChatTool>[0]) {
  const normalized = normalizeChatTool(raw);
  if (normalized) tools[name] = normalized;
}

export async function buildTools(userRole: AppRole, userId: string, userName: string) {
  const scope = await resolveChatToolScope(userId, userName, userRole);
  const tools: Record<string, unknown> = {};

  // Conocimiento canónico para todos los roles (evita inventar módulos).
  addTool(tools, "getPlatformKnowledge", createGetPlatformKnowledge());
  addTool(tools, "searchEvents", createSearchEvents(scope));

  if (userRole === "member") {
    addTool(tools, "getMyTickets", getMyTickets(userId));
    return tools;
  }

  const canViewRegistrations =
    userRole === "super_admin" ||
    userRole === "organizer" ||
    (userRole === "admin" && (await hasEffectivePermission(userRole, "registrations:view:any")));

  const canViewUsers =
    userRole === "super_admin" ||
    (userRole === "admin" && (await hasEffectivePermission(userRole, "users:manage")));

  const canSendNotifications =
    userRole === "super_admin" ||
    userRole === "organizer" ||
    (userRole === "admin" && (await hasEffectivePermission(userRole, "events:update:any")));

  addTool(tools, "getEventStats", createGetEventStats(scope));
  addTool(tools, "getEventRoutes", createGetEventRoutes(scope));

  if (canViewRegistrations) {
    addTool(tools, "getRegistrationsList", createGetRegistrationsList(scope));
  }

  if (canSendNotifications) {
    addTool(tools, "previewMassNotification", createPreviewMassNotification(scope));
    addTool(tools, "sendMassNotification", createSendMassNotification(scope));
  }

  if (canViewUsers) {
    addTool(tools, "getUsersList", createGetUsersList(scope));
  }

  const canViewAudit =
    (userRole === "super_admin" && (await hasEffectivePermission(userRole, "permissions:view"))) ||
    (scope.adminScope.mode === "org" && userRole === "admin");

  if (canViewAudit) {
    addTool(tools, "getAuditLogs", createGetAuditLogs(scope));
  }

  return tools;
}

export type { ChatToolScope };
