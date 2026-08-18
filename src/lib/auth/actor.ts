import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizationMembers, organizations, users } from "@/lib/db/schema";
import { normalizeRole, type AppRole } from "./rbac";
import {
  appRoleForOrganizationContext,
  isMembershipRole,
  type MembershipRole,
} from "./membership-role";

export type { MembershipRole };

export type AuthorizationActor = {
  id: string;
  name: string;
  /** Rol usado para la matriz de permisos (membresía activa, o plataforma). */
  role: AppRole;
  /** Rol persistido en `users.role` (espejo del contexto activo, o super_admin). */
  globalRole: AppRole;
  organizationId: string | null;
  membershipRole: MembershipRole | null;
};

/**
 * Resuelve el actor de autorización.
 * `super_admin` es el único rol de plataforma.
 * En una entidad, manda la membresía activa (`users.organizationId`).
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

    if (globalRole === "super_admin") {
      return {
        id: userId,
        name,
        role: "super_admin",
        globalRole,
        organizationId,
        membershipRole: null,
      };
    }

    if (!organizationId) {
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
        ownerId: organizations.ownerId,
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

    if (!membership || membership.status !== "active" || !isMembershipRole(membership.role)) {
      return {
        id: userId,
        name,
        role: globalRole,
        globalRole,
        organizationId,
        membershipRole: null,
      };
    }

    const membershipRole = membership.role;
    const role = appRoleForOrganizationContext({
      userId,
      organizationOwnerId: membership.ownerId,
      membershipRole,
    });

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
