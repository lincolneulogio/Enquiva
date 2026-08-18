import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizationMembers, organizations, users } from "@/lib/db/schema";
import { normalizeRole, type AppRole } from "./rbac";

export type MembershipRole = "owner" | "organizer" | "member" | "scanner";

export type AuthorizationActor = {
  id: string;
  name: string;
  /** Rol usado para la matriz de permisos. */
  role: AppRole;
  /** Rol global en `users.role`. */
  globalRole: AppRole;
  organizationId: string | null;
  membershipRole: MembershipRole | null;
};

function mapMembershipToAppRole(membershipRole: MembershipRole): AppRole {
  if (membershipRole === "owner") return "admin";
  if (membershipRole === "organizer") return "organizer";
  if (membershipRole === "scanner") return "scanner";
  return "member";
}

/**
 * Resuelve el actor de autorización.
 * Plataforma (`super_admin`) usa el rol global.
 * En una entidad, el rol de membresía manda salvo que el global sea `admin`
 * (dueño/admin de entidad), para no degradar al admin a organizador.
 */
export const resolveAuthorizationActor = cache(
  async (userId: string, fallbackRole?: string | null): Promise<AuthorizationActor> => {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        organizationId: users.organizationId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const globalRole = normalizeRole(user?.role ?? fallbackRole);
    const organizationId = user?.organizationId ?? null;
    const name = user?.name ?? "Usuario";

    if (globalRole === "super_admin" || !organizationId) {
      return {
        id: userId,
        name,
        role: globalRole,
        globalRole,
        organizationId,
        membershipRole: null,
      };
    }

    const [membership] = await db
      .select({
        role: organizationMembers.role,
        status: organizationMembers.status,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (!membership || membership.status !== "active") {
      return {
        id: userId,
        name,
        role: globalRole,
        globalRole,
        organizationId,
        membershipRole: null,
      };
    }

    const membershipRole = membership.role as MembershipRole;
    const roleFromMembership = mapMembershipToAppRole(membershipRole);
    const role = globalRole === "admin" ? "admin" : roleFromMembership;

    return {
      id: userId,
      name,
      role,
      globalRole,
      organizationId,
      membershipRole,
    };
  },
);
