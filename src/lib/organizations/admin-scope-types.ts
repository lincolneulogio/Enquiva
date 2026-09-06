import { cache } from "react";
import { eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { normalizeRole } from "@/lib/auth/rbac";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { getRequestSession } from "@/lib/request-context";

export type AdminScope =
  | { mode: "platform" }
  | { mode: "org"; organizationId: string; organizationName: string; inviteCode: string }
  | { mode: "unassigned" };

/** Condición SQL que no devuelve filas — para admin sin entidad. */
export function scopeDenyAllCondition(): SQL {
  return sql`1 = 0`;
}

export function isUnassignedAdminScope(scope: AdminScope): boolean {
  return scope.mode === "unassigned";
}

export const resolveAdminScope = cache(async (): Promise<AdminScope> => {
  const session = await getRequestSession();
  if (!session?.user) throw new Error("Unauthorized");

  const role = normalizeRole(session.user.role);
  if (role === "super_admin") {
    return { mode: "platform" };
  }

  if (role === "admin") {
    const org = await OrganizationService.getOrganizationForUser(session.user.id);
    if (org) {
      return {
        mode: "org",
        organizationId: org.id,
        organizationName: org.name,
        inviteCode: org.inviteCode,
      };
    }
    return { mode: "unassigned" };
  }

  return { mode: "platform" };
});

export async function resolveAdminScopeForUser(
  userId: string,
  role: string | null | undefined,
): Promise<AdminScope> {
  const normalized = normalizeRole(role);
  if (normalized === "super_admin") return { mode: "platform" };
  if (normalized === "admin" || normalized === "scanner") {
    const org = await OrganizationService.getOrganizationForUser(userId);
    if (org) {
      return {
        mode: "org",
        organizationId: org.id,
        organizationName: org.name,
        inviteCode: org.inviteCode,
      };
    }
    return { mode: "unassigned" };
  }
  return { mode: "platform" };
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

const UNASSIGNED_ADMIN_ALLOWED_PATHS = [
  "/admin/onboarding",
  "/admin/profile",
  "/admin/registered-events",
];

export function isPathAllowedForUnassignedAdmin(pathname: string): boolean {
  return UNASSIGNED_ADMIN_ALLOWED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
