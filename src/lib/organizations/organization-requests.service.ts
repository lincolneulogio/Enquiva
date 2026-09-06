import { db } from "@/lib/db";
import {
  organizations,
  organizationMembers,
  users,
} from "@/lib/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { normalizeRole } from "@/lib/auth/rbac";
import { shouldApplyMembershipToUserRecord } from "@/lib/auth/membership-role";
import { SubscriptionService } from "@/lib/billing/subscription.service";
import { OrganizationCoreService } from "./organization-core.service";
import { OrganizationTeamService } from "./organization-team.service";

export class OrganizationRequestsService {
  static async requestJoinOrganizationAsOrganizer(input: {
    userId: string;
    inviteCode: string;
  }) {
    const org = await OrganizationCoreService.getByInviteCode(input.inviteCode);
    if (!org) throw new Error("Código de entidad inválido o inactivo.");

    const [existingMember] = await db
      .select({
        id: organizationMembers.id,
        status: organizationMembers.status,
      })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, org.id),
          eq(organizationMembers.userId, input.userId),
        ),
      )
      .limit(1);

    if (existingMember?.status === "active") {
      throw new Error("Ya perteneces a esta entidad.");
    }
    if (existingMember?.status === "pending") {
      throw new Error("Tu solicitud ya está pendiente de aprobación.");
    }

    const [currentUser] = await db
      .select({ organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    if (existingMember?.status === "rejected") {
      await db
        .update(organizationMembers)
        .set({ status: "pending", role: "organizer" })
        .where(eq(organizationMembers.id, existingMember.id));
    } else {
      await db.insert(organizationMembers).values({
        organizationId: org.id,
        userId: input.userId,
        role: "organizer",
        status: "pending",
      });
    }

    if (shouldApplyMembershipToUserRecord(currentUser?.organizationId, org.id)) {
      await db
        .update(users)
        .set({ organizationId: org.id, role: "organizer", updatedAt: new Date() })
        .where(eq(users.id, input.userId));
    }

    return org;
  }

  /** @deprecated Use requestJoinOrganizationAsOrganizer for invite-based joins. */
  static async joinOrganizationAsOrganizer(input: {
    userId: string;
    inviteCode: string;
  }) {
    return this.requestJoinOrganizationAsOrganizer(input);
  }

  static async resolvePendingOrganizerRequestContext(input: {
    actorId: string;
    actorRole: string | null | undefined;
    targetUserId: string;
  }) {
    const pending = await this.getPendingOrganizerMembershipForUser(input.targetUserId);
    if (!pending) throw new Error("No hay una solicitud pendiente de este usuario.");

    const isSuper = normalizeRole(input.actorRole) === "super_admin";
    if (isSuper) {
      return pending;
    }

    const actorOrg = await OrganizationCoreService.getOrganizationForUser(input.actorId);
    if (!actorOrg) throw new Error("No perteneces a una entidad.");
    if (actorOrg.id !== pending.organization.id) {
      throw new Error("Este usuario no pertenece a tu entidad.");
    }
    if (actorOrg.ownerId !== input.actorId) {
      throw new Error("Solo el administrador de la entidad puede gestionar solicitudes.");
    }

    return pending;
  }

  static async approveOrganizerRequest(input: {
    actorId: string;
    actorRole: string | null | undefined;
    targetUserId: string;
  }) {
    const pending = await this.resolvePendingOrganizerRequestContext(input);
    const actorOrg = pending.organization;
    const memberRow = pending.member;

    await OrganizationTeamService.assertCanAddOrganizerToOrg(actorOrg.id);

    const [target] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        organizationId: users.organizationId,
      })
      .from(users)
      .where(eq(users.id, input.targetUserId))
      .limit(1);
    if (!target) throw new Error("Usuario no encontrado.");

    await db.transaction(async (trx) => {
      await trx
        .update(organizationMembers)
        .set({ status: "active" })
        .where(eq(organizationMembers.id, memberRow.id));

      if (shouldApplyMembershipToUserRecord(target.organizationId, actorOrg.id)) {
        await trx
          .update(users)
          .set({ organizationId: actorOrg.id, role: "organizer", updatedAt: new Date() })
          .where(eq(users.id, input.targetUserId));
      }
    });

    return { organization: actorOrg, user: target };
  }

  static async rejectOrganizerRequest(input: {
    actorId: string;
    actorRole: string | null | undefined;
    targetUserId: string;
  }) {
    const pending = await this.resolvePendingOrganizerRequestContext(input);
    const actorOrg = pending.organization;
    const memberRow = pending.member;

    const [target] = await db
      .select({ id: users.id, name: users.name, email: users.email, organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, input.targetUserId))
      .limit(1);
    if (!target) throw new Error("Usuario no encontrado.");

    await db.transaction(async (trx) => {
      await trx
        .update(organizationMembers)
        .set({ status: "rejected" })
        .where(eq(organizationMembers.id, memberRow.id));

      if (target.organizationId === actorOrg.id) {
        await trx
          .update(users)
          .set({ organizationId: null, role: "member", updatedAt: new Date() })
          .where(eq(users.id, input.targetUserId));
      }
    });

    return { organization: actorOrg, user: target };
  }

  static async listPendingOrganizerRequests(organizationId: string) {
    return db
      .select({
        member: organizationMembers,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        },
      })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.role, "organizer"),
          eq(organizationMembers.status, "pending"),
        ),
      )
      .orderBy(asc(organizationMembers.createdAt));
  }

  static async getPendingOrganizerMembershipForUser(userId: string) {
    const [row] = await db
      .select({
        member: organizationMembers,
        organization: organizations,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.role, "organizer"),
          eq(organizationMembers.status, "pending"),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  static async activateIndependentOrganizer(input: { userId: string }) {
    const [user] = await db
      .select({ organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    if (!user) throw new Error("Usuario no encontrado.");
    if (user.organizationId) throw new Error("Ya perteneces a una entidad.");

    await db
      .update(users)
      .set({ role: "organizer", updatedAt: new Date() })
      .where(eq(users.id, input.userId));

    try {
      await SubscriptionService.getOrCreateSubscription(input.userId, "organizer");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("PLANS_NOT_CONFIGURED") && !message.includes("Plan free")) {
        throw error;
      }
      // Sin planes aún: el rol organizer ya quedó activo; la suscripción se crea después.
    }

    return { success: true };
  }
}
