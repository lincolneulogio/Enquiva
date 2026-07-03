import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, type SQL, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, users, categories, registrations, payments, transportRoutes, transportBookings } from "@/lib/db/schema";
import { normalizeRole } from "@/lib/auth/rbac";
import { OrganizationService } from "@/lib/organizations/organization.service";

export type AdminScope =
  | { mode: "platform" }
  | { mode: "org"; organizationId: string; organizationName: string };

export async function resolveAdminScope(): Promise<AdminScope> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const role = normalizeRole(session.user.role);
  if (role === "super_admin") {
    return { mode: "platform" };
  }

  if (role === "admin") {
    const org = await OrganizationService.getOrganizationForUser(session.user.id);
    if (org) {
      return { mode: "org", organizationId: org.id, organizationName: org.name };
    }
  }

  return { mode: "platform" };
}

export async function resolveAdminScopeForUser(
  userId: string,
  role: string | null | undefined,
): Promise<AdminScope> {
  const normalized = normalizeRole(role);
  if (normalized === "super_admin") return { mode: "platform" };
  if (normalized === "admin") {
    const org = await OrganizationService.getOrganizationForUser(userId);
    if (org) return { mode: "org", organizationId: org.id, organizationName: org.name };
  }
  return { mode: "platform" };
}

export function scopeEventCondition(scope: AdminScope): SQL | undefined {
  if (scope.mode === "org") {
    return eq(events.organizationId, scope.organizationId);
  }
  return undefined;
}

export function scopeUserCondition(scope: AdminScope): SQL | undefined {
  if (scope.mode === "org") {
    return eq(users.organizationId, scope.organizationId);
  }
  return undefined;
}

export function scopeCategoryCondition(scope: AdminScope): SQL | undefined {
  if (scope.mode === "org") {
    return eq(categories.organizationId, scope.organizationId);
  }
  return undefined;
}

export function scopeEventConditionForOrgId(organizationId: string | null): SQL | undefined {
  if (!organizationId) return undefined;
  return eq(events.organizationId, organizationId);
}

export function registrationInOrgCondition(organizationId: string) {
  return inArray(
    registrations.eventId,
    db.select({ id: events.id }).from(events).where(eq(events.organizationId, organizationId)),
  );
}

export function paymentInOrgCondition(organizationId: string) {
  return inArray(
    payments.registrationId,
    db
      .select({ id: registrations.id })
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .where(eq(events.organizationId, organizationId)),
  );
}

export function transportRouteInOrgCondition(organizationId: string) {
  return inArray(
    transportRoutes.eventId,
    db.select({ id: events.id }).from(events).where(eq(events.organizationId, organizationId)),
  );
}

export function transportBookingInOrgCondition(organizationId: string) {
  return inArray(
    transportBookings.routeId,
    db
      .select({ id: transportRoutes.id })
      .from(transportRoutes)
      .innerJoin(events, eq(transportRoutes.eventId, events.id))
      .where(eq(events.organizationId, organizationId)),
  );
}

export function andWithScope(
  conditions: SQL[],
  ...scopes: Array<SQL | undefined>
): SQL | undefined {
  const all = [...conditions, ...scopes.filter(Boolean)] as SQL[];
  if (all.length === 0) return undefined;
  if (all.length === 1) return all[0];
  return and(...all);
}

export async function getOrganizationIdForUser(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ organizationId: users.organizationId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.organizationId ?? null;
}

export function getOrganizationIdFromScope(scope: AdminScope): string | null {
  return scope.mode === "org" ? scope.organizationId : null;
}
