import { getMyTickets } from "./my-tickets";
import { createSearchEvents } from "./search-events";
import { createGetEventStats } from "./event-stats";
import { createGetEventRoutes } from "./event-routes";
import { createPreviewMassNotification, createSendMassNotification } from "./mass-notification";
import { createGetAuditLogs } from "./audit-logs";
import { createGetUsersList } from "./users";
import { createGetRegistrationsList } from "./registrations";
import { createGetPlatformKnowledge } from "./platform-knowledge";
import { createGetPaymentStatus, createGetCheckInStats } from "./payment-checkin";
import {
  createGetMyPlanBilling,
  createGetTransportSeats,
  createGetMyNextEvent,
  createDraftBroadcast,
} from "./business-extras";
import { getEffectivePermissionsForRole } from "@/lib/auth/effective-permissions";
import { resolveChatToolScope, type ChatToolScope } from "./scope";
import { enabledChatTools, type ChatToolName } from "./chat-tool-policy";
import { normalizeChatTool } from "./chat-tool";
import type { AppRole } from "@/lib/auth/rbac";

import { DEFAULT_PLATFORM_TIMEZONE } from "@/lib/settings/platform-locale";
import type { Locale } from "@/lib/i18n/core";

function addTool(tools: Record<string, unknown>, name: string, raw: Parameters<typeof normalizeChatTool>[0]) {
  const normalized = normalizeChatTool(raw);
  if (normalized) tools[name] = normalized;
}

export async function buildTools(
  userRole: AppRole,
  userId: string,
  userName: string,
  timeZone: string = DEFAULT_PLATFORM_TIMEZONE,
  locale: Locale = "es",
) {
  const scope = await resolveChatToolScope(userId, userName, userRole, timeZone, locale);
  const granted = new Set(await getEffectivePermissionsForRole(userRole));
  const enabled = enabledChatTools(granted, userRole);
  const tools: Record<string, unknown> = {};

  const maybeAdd = (name: ChatToolName, factory: () => Parameters<typeof normalizeChatTool>[0]) => {
    if (!enabled.has(name)) return;
    addTool(tools, name, factory());
  };

  maybeAdd("getPlatformKnowledge", () => createGetPlatformKnowledge());
  maybeAdd("searchEvents", () => createSearchEvents(scope));
  maybeAdd("getPaymentStatus", () => createGetPaymentStatus(scope));
  maybeAdd("getMyPlanBilling", () => createGetMyPlanBilling(scope));
  maybeAdd("getMyNextEvent", () => createGetMyNextEvent(scope));
  maybeAdd("getMyTickets", () => getMyTickets(userId, scope.timeZone, scope.locale));
  maybeAdd("getEventStats", () => createGetEventStats(scope));
  maybeAdd("getEventRoutes", () => createGetEventRoutes(scope));
  maybeAdd("getCheckInStats", () => createGetCheckInStats(scope));
  maybeAdd("getTransportSeats", () => createGetTransportSeats(scope));
  maybeAdd("draftBroadcast", () => createDraftBroadcast(scope));
  maybeAdd("getRegistrationsList", () => createGetRegistrationsList(scope));
  maybeAdd("previewMassNotification", () => createPreviewMassNotification(scope));
  maybeAdd("sendMassNotification", () => createSendMassNotification(scope));
  maybeAdd("getUsersList", () => createGetUsersList(scope));
  maybeAdd("getAuditLogs", () => createGetAuditLogs(scope));

  return tools;
}

export type { ChatToolScope };
