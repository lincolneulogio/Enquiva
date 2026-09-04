import { db } from "@/lib/db";
import { events, registrations } from "@/lib/db/schema";
import { eq, inArray, type SQL } from "drizzle-orm";
import type { AppRole } from "@/lib/auth/rbac";
import {
  type AdminScope,
  registrationInOrgCondition,
  resolveAdminScopeForUser,
  scopeDenyAllCondition,
  scopeEventCondition,
  scopeUserCondition,
} from "@/lib/organizations/admin-scope";

import type { Locale } from "@/lib/i18n/core";
import { DEFAULT_PLATFORM_TIMEZONE } from "@/lib/settings/platform-locale";

export type ChatToolScope = {
  userId: string;
  userName: string;
  role: AppRole;
  adminScope: AdminScope;
  timeZone: string;
  locale: Locale;
};

export async function resolveChatToolScope(
  userId: string,
  userName: string,
  role: AppRole,
  timeZone: string = DEFAULT_PLATFORM_TIMEZONE,
  locale: Locale = "es",
): Promise<ChatToolScope> {
  const adminScope = await resolveAdminScopeForUser(userId, role);
  return { userId, userName, role, adminScope, timeZone, locale };
}

export function scopeEventsForChat(scope: ChatToolScope): SQL | undefined {
  if (scope.role === "super_admin") return undefined;
  if (scope.role === "admin" || scope.role === "scanner") {
    return scopeEventCondition(scope.adminScope);
  }
  if (scope.role === "organizer") return eq(events.organizerId, scope.userId);
  return scopeDenyAllCondition();
}

export function scopeUsersForChat(scope: ChatToolScope): SQL | undefined {
  if (scope.role === "super_admin") return undefined;
  if (scope.role === "admin") return scopeUserCondition(scope.adminScope);
  return scopeDenyAllCondition();
}

export function scopeRegistrationsForChat(scope: ChatToolScope): SQL | undefined {
  if (scope.role === "super_admin") return undefined;
  if (scope.role === "admin" || scope.role === "scanner") {
    if (scope.adminScope.mode !== "org") return scopeDenyAllCondition();
    return registrationInOrgCondition(scope.adminScope.organizationId);
  }
  if (scope.role === "organizer") {
    return inArray(
      registrations.eventId,
      db.select({ id: events.id }).from(events).where(eq(events.organizerId, scope.userId)),
    );
  }
  return scopeDenyAllCondition();
}

export function canUsePlatformAuditTools(scope: ChatToolScope): boolean {
  return scope.role === "super_admin";
}

export function canUseScopedAuditTools(scope: ChatToolScope): boolean {
  return scope.role === "admin" && scope.adminScope.mode === "org";
}

export function canUseScopedUserList(scope: ChatToolScope): boolean {
  return scope.role === "super_admin" || scope.role === "admin";
}

export function canUseStaffChatTools(scope: ChatToolScope): boolean {
  return scope.role === "super_admin" || scope.role === "admin" || scope.role === "organizer";
}

/** Scanner de entidad: check-in / listados con SQL de tenant, sin analytics ni usuarios. */
export function canUseOrgDoorChatTools(scope: ChatToolScope): boolean {
  return canUseStaffChatTools(scope) || scope.role === "scanner";
}
