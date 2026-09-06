import { db } from "@/lib/db";
import {
  organizations,
  organizationMembers,
  users,
} from "@/lib/db/schema";
import { and, eq, asc, count } from "drizzle-orm";
import { normalizeRole } from "@/lib/auth/rbac";
import { shouldApplyMembershipToUserRecord } from "@/lib/auth/membership-role";
import { SubscriptionService } from "@/lib/billing/subscription.service";
import { PlanLimitError } from "@/lib/billing/enforce";
import { OrganizationCoreService } from "./organization-core.service";

export class OrganizationTeamService {
  static async countOrganizerSlotsInOrg(organizationId: string) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.role, "organizer"),
          eq(organizationMembers.status, "active"),
        ),
      );
    return total ?? 0;
  }

  static async assertCanAddOrganizerToOrg(organizationId: string) {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);
    if (!org) throw new Error("Entidad no encontrada.");

    const plan = await SubscriptionService.getOrganizationPlan(organizationId);
    if (plan.maxOrganizers == null) return;

    const used = await this.countOrganizerSlotsInOrg(organizationId);
    if (used >= plan.maxOrganizers) {
      throw new PlanLimitError(
        `El plan ${plan.name} de esta entidad permite hasta ${plan.maxOrganizers} organizador(es) de eventos (sin contar al administrador). Actualiza el plan en facturación.`,
      );
    }
  }

  static async listTeamMembers(organizationId: string) {
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
          eq(organizationMembers.status, "active"),
        ),
      )
      .orderBy(asc(organizationMembers.createdAt));
  }

  static async getOrganizerIdsInOrg(organizationId: string) {
    const rows = await db
      .select({ userId: organizationMembers.userId })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.role, "organizer"),
          eq(organizationMembers.status, "active"),
        ),
      );
    return rows.map((r) => r.userId);
  }

  static async validateOrganizerInviteForSignup(inviteCode: string) {
    const org = await OrganizationCoreService.getByInviteCode(inviteCode);
    if (!org) {
      throw new Error("INVITE_CODE_INVALID");
    }

    const plan = await SubscriptionService.getOrganizationPlan(org.id);

    return {
      organizationName: org.name,
      planName: plan.name,
      maxOrganizers: plan.maxOrganizers,
      usedOrganizerSlots: await this.countOrganizerSlotsInOrg(org.id),
    };
  }

  static async promoteUserInOrg(input: {
    actorId: string;
    actorRole: string | null | undefined;
    targetUserId: string;
    newRole: "organizer" | "member" | "scanner";
  }) {
    const actorOrg = await OrganizationCoreService.getOrganizationForUser(input.actorId);
    if (!actorOrg) throw new Error("No perteneces a una entidad.");

    const isSuper = normalizeRole(input.actorRole) === "super_admin";
    const isOwner = actorOrg.ownerId === input.actorId;
    if (!isSuper && !isOwner) {
      throw new Error("Solo el administrador de la entidad puede gestionar el equipo.");
    }

    const [target] = await db
      .select()
      .from(users)
      .where(eq(users.id, input.targetUserId))
      .limit(1);
    if (!target) throw new Error("Usuario no encontrado.");
    if (target.id === actorOrg.ownerId) {
      throw new Error("No puedes cambiar el rol del dueño de la entidad.");
    }

    const [memberRow] = await db
      .select({ id: organizationMembers.id, role: organizationMembers.role, status: organizationMembers.status })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, input.targetUserId),
          eq(organizationMembers.organizationId, actorOrg.id),
        ),
      )
      .limit(1);

    if (!memberRow && target.organizationId !== actorOrg.id) {
      throw new Error("Este usuario no pertenece a tu entidad.");
    }

    if (input.newRole === "organizer" && memberRow?.status !== "active" && !isSuper) {
      await this.assertCanAddOrganizerToOrg(actorOrg.id);
    }

    const globalRole =
      input.newRole === "organizer"
        ? "organizer"
        : input.newRole === "scanner"
          ? "scanner"
          : "member";
    const memberStatus = "active" as const;
    const memberRole = input.newRole;

    await db.transaction(async (trx) => {
      if (memberRow) {
        await trx
          .update(organizationMembers)
          .set({
            role: memberRole,
            status: memberStatus,
          })
          .where(eq(organizationMembers.id, memberRow.id));
      } else {
        await trx.insert(organizationMembers).values({
          organizationId: actorOrg.id,
          userId: input.targetUserId,
          role: memberRole,
          status: memberStatus,
        });
      }

      if (shouldApplyMembershipToUserRecord(target.organizationId, actorOrg.id)) {
        await trx
          .update(users)
          .set({
            role: globalRole,
            organizationId: actorOrg.id,
            updatedAt: new Date(),
          })
          .where(eq(users.id, input.targetUserId));
      }
    });

    return { success: true };
  }
}
