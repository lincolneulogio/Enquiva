import { getMyTickets } from "./my-tickets";
import { createSearchEvents } from "./search-events";
import { createGetEventStats } from "./event-stats";
import { createGetEventRoutes } from "./event-routes";
import { createSendMassNotification } from "./mass-notification";
import { createGetAuditLogs } from "./audit-logs";
import { createGetUsersList } from "./users";
import { createGetRegistrationsList } from "./registrations";
import { hasEffectivePermission } from "@/lib/auth/effective-permissions";
import { resolveChatToolScope, type ChatToolScope } from "./scope";
import type { AppRole } from "@/lib/auth/rbac";

function addTool<T extends Record<string, unknown>>(tools: Record<string, unknown>, name: string, tool: T | null) {
  if (tool) tools[name] = tool;
}

export async function buildTools(userRole: AppRole, userId: string, userName: string) {
  const scope = await resolveChatToolScope(userId, userName, userRole);
  const tools: Record<string, unknown> = {};

  addTool(tools, "searchEvents", createSearchEvents(scope));

  if (userRole === "member") {
    tools.getMyTickets = getMyTickets(userId);
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
    addTool(tools, "sendMassNotification", createSendMassNotification(scope));
  }

  if (canViewUsers) {
    addTool(tools, "getUsersList", createGetUsersList(scope));
  }

  if (userRole === "super_admin" && (await hasEffectivePermission(userRole, "permissions:view"))) {
    addTool(tools, "getAuditLogs", createGetAuditLogs(scope));
  }

  return tools;
}

export type { ChatToolScope };
