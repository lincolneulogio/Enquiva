import { db } from "@/lib/db";
import {
  organizations,
  organizationMembers,
  users,
} from "@/lib/db/schema";
import { and, eq, asc, inArray } from "drizzle-orm";
import { normalizeRole, type AppRole } from "@/lib/auth/rbac";
import {
  appRoleForOrganizationContext,
  isMembershipRole,
  type MembershipRole,
} from "@/lib/auth/membership-role";
import type { ActiveOrganizationMembership } from "./active-membership";

export class OrganizationMembershipService {
  static async listActiveMembershipsForUser(userId: string): Promise<ActiveOrganizationMembership[]> {
    const [user] = await db
      .select({ organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const rows = await db
      .select({
        organizationId: organizations.id,
        organizationName: organizations.name,
        membershipRole: organizationMembers.role,
        ownerId: organizations.ownerId,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.status, "active"),
          eq(organizations.isActive, true),
        ),
      )
      .orderBy(asc(organizations.name));

    return rows
      .filter((row): row is typeof row & { membershipRole: MembershipRole } =>
        isMembershipRole(row.membershipRole),
      )
      .map((row) => ({
        organizationId: row.organizationId,
        organizationName: row.organizationName,
        membershipRole: row.membershipRole,
        appRole: appRoleForOrganizationContext({
          userId,
          organizationOwnerId: row.ownerId,
          membershipRole: row.membershipRole,
        }),
        isCurrent: user?.organizationId === row.organizationId,
      }));
  }

  static async switchActiveOrganization(input: {
    userId: string;
    organizationId: string;
  }): Promise<{ organizationId: string; appRole: AppRole; organizationName: string }> {
    const [user] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    if (!user) throw new Error("Usuario no encontrado.");
    if (normalizeRole(user.role) === "super_admin") {
      throw new Error("El rol de plataforma no cambia de entidad.");
    }

    const [membership] = await db
      .select({
        role: organizationMembers.role,
        status: organizationMembers.status,
        ownerId: organizations.ownerId,
        organizationName: organizations.name,
        isActive: organizations.isActive,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
      .where(
        and(
          eq(organizationMembers.userId, input.userId),
          eq(organizationMembers.organizationId, input.organizationId),
        ),
      )
      .limit(1);

    if (!membership || membership.status !== "active" || !membership.isActive) {
      throw new Error("No tienes una membresía activa en esa entidad.");
    }
    if (!isMembershipRole(membership.role)) {
      throw new Error("Rol de membresía no válido.");
    }

    const appRole = appRoleForOrganizationContext({
      userId: input.userId,
      organizationOwnerId: membership.ownerId,
      membershipRole: membership.role,
    });

    await db
      .update(users)
      .set({
        organizationId: input.organizationId,
        role: appRole,
        updatedAt: new Date(),
      })
      .where(eq(users.id, input.userId));

    return {
      organizationId: input.organizationId,
      appRole,
      organizationName: membership.organizationName,
    };
  }

  static async syncUserRoleWithOrganizationMembership(
    userId: string,
    globalRole: "member" | "organizer" | "admin" | "super_admin" | "scanner",
  ) {
    const [user] = await db
      .select({ organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user?.organizationId) return;
    if (globalRole === "super_admin") return;

    const [org] = await db
      .select({ ownerId: organizations.ownerId })
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
      .limit(1);

    if (!org) return;

    const [memberRow] = await db
      .select({ id: organizationMembers.id, role: organizationMembers.role })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, user.organizationId),
        ),
      )
      .limit(1);

    const targetMemberRole =
      userId === org.ownerId
        ? "owner"
        : globalRole === "organizer" || globalRole === "admin"
          ? "organizer"
          : globalRole === "scanner"
            ? "scanner"
            : "member";

    if (!memberRow) {
      await db.insert(organizationMembers).values({
        organizationId: user.organizationId,
        userId,
        role: targetMemberRole,
        status: "active",
      });
      return;
    }

    if (memberRow.role === "owner") return;

    const memberStatus = "active" as const;

    if (memberRow.role !== targetMemberRole) {
      await db
        .update(organizationMembers)
        .set({ role: targetMemberRole, status: memberStatus })
        .where(eq(organizationMembers.id, memberRow.id));
      return;
    }

    if (globalRole === "organizer") {
      await db
        .update(organizationMembers)
        .set({ status: "active" })
        .where(eq(organizationMembers.id, memberRow.id));
    }
  }

  static async getOrgMembershipMap(organizationId: string, userIds: string[]) {
    if (userIds.length === 0) return new Map<string, { role: string; status: string }>();

    const rows = await db
      .select({
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        status: organizationMembers.status,
      })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          inArray(organizationMembers.userId, userIds),
        ),
      );

    return new Map(rows.map((row) => [row.userId, { role: row.role, status: row.status }]));
  }

  static async getMembershipSummaryForUsers(userIds: string[]) {
    if (userIds.length === 0) {
      return new Map<string, { organizationName: string; role: string; status: string }>();
    }

    const rows = await db
      .select({
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        status: organizationMembers.status,
        organizationName: organizations.name,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(inArray(organizationMembers.userId, userIds));

    return new Map(
      rows.map((row) => [
        row.userId,
        {
          organizationName: row.organizationName,
          role: row.role,
          status: row.status,
        },
      ]),
    );
  }
}
