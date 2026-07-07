import { db } from "@/lib/db";
import {
  organizations,
  organizationMembers,
  users,
  type Organization,
} from "@/lib/db/schema";
import { and, eq, inArray, asc, count } from "drizzle-orm";
import { normalizeRole } from "@/lib/auth/rbac";
import { SubscriptionService } from "@/lib/billing/subscription.service";
import { PlanLimitError } from "@/lib/billing/enforce";

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function randomInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export type SignupIntentPayload =
  | { type: "member" }
  | { type: "organizer"; inviteCode?: string }
  | { type: "entity_admin"; orgName: string }
  | { type: "platform_owner" };

export class OrganizationService {
  static async getByInviteCode(code: string) {
    const normalized = code.trim().toUpperCase();
    const [org] = await db
      .select()
      .from(organizations)
      .where(and(eq(organizations.inviteCode, normalized), eq(organizations.isActive, true)))
      .limit(1);
    return org ?? null;
  }

  static async listActiveOrganizations() {
    return db
      .select({ id: organizations.id, name: organizations.name })
      .from(organizations)
      .where(eq(organizations.isActive, true))
      .orderBy(asc(organizations.name));
  }

  static async getOrganizationForUser(userId: string): Promise<Organization | null> {
    const [user] = await db
      .select({ organizationId: users.organizationId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user?.organizationId) return null;

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
      .limit(1);
    return org ?? null;
  }

  static async isOrgAdmin(userId: string, role?: string | null) {
    if (normalizeRole(role) === "super_admin") return true;
    if (normalizeRole(role) !== "admin") return false;

    const org = await this.getOrganizationForUser(userId);
    if (!org) return false;
    return org.ownerId === userId;
  }

  static async createOrganizationForAdmin(input: {
    name: string;
    ownerUserId: string;
  }) {
    const baseSlug = slugify(input.name) || "entidad";
    let slug = baseSlug;
    let inviteCode = randomInviteCode();
    let attempts = 0;

    while (attempts < 10) {
      try {
        const [org] = await db
          .insert(organizations)
          .values({
            name: input.name.trim(),
            slug,
            inviteCode,
            ownerId: input.ownerUserId,
          })
          .returning();

        await db.insert(organizationMembers).values({
          organizationId: org.id,
          userId: input.ownerUserId,
          role: "owner",
        });

        await db
          .update(users)
          .set({ organizationId: org.id, role: "admin", updatedAt: new Date() })
          .where(eq(users.id, input.ownerUserId));

        const { SubscriptionService } = await import("@/lib/billing/subscription.service");
        await SubscriptionService.ensureOrganizationSubscription(org.id, input.ownerUserId);

        return org;
      } catch {
        attempts += 1;
        slug = `${baseSlug}-${attempts}`;
        inviteCode = randomInviteCode();
      }
    }

    throw new Error("No se pudo crear la organización. Intenta con otro nombre.");
  }

  static async joinOrganizationAsOrganizer(input: {
    userId: string;
    inviteCode: string;
  }) {
    const org = await this.getByInviteCode(input.inviteCode);
    if (!org) throw new Error("Código de entidad inválido o inactivo.");

    const [existingMember] = await db
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, org.id),
          eq(organizationMembers.userId, input.userId),
        ),
      )
      .limit(1);
    if (existingMember) throw new Error("Ya perteneces a esta entidad.");

    await this.assertCanAddOrganizerToOrg(org.id);

    await db.insert(organizationMembers).values({
      organizationId: org.id,
      userId: input.userId,
      role: "organizer",
    });

    await db
      .update(users)
      .set({ organizationId: org.id, role: "organizer", updatedAt: new Date() })
      .where(eq(users.id, input.userId));

    return org;
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

    await SubscriptionService.getOrCreateSubscription(input.userId, "organizer");

    return { success: true };
  }

  static async promoteUserInOrg(input: {
    actorId: string;
    actorRole: string | null | undefined;
    targetUserId: string;
    newRole: "organizer" | "member";
  }) {
    const actorOrg = await this.getOrganizationForUser(input.actorId);
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
    if (target.organizationId !== actorOrg.id) {
      throw new Error("Este usuario no pertenece a tu entidad.");
    }
    if (target.id === actorOrg.ownerId) {
      throw new Error("No puedes cambiar el rol del dueño de la entidad.");
    }

    const [memberRow] = await db
      .select({ role: organizationMembers.role })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, input.targetUserId),
          eq(organizationMembers.organizationId, actorOrg.id),
        ),
      )
      .limit(1);

    if (
      input.newRole === "organizer" &&
      memberRow?.role !== "organizer" &&
      !isSuper
    ) {
      await this.assertCanAddOrganizerToOrg(actorOrg.id);
    }

    const globalRole = input.newRole === "organizer" ? "organizer" : "member";

    await db.transaction(async (trx) => {
      await trx
        .update(users)
        .set({ role: globalRole, updatedAt: new Date() })
        .where(eq(users.id, input.targetUserId));

      await trx
        .update(organizationMembers)
        .set({ role: input.newRole })
        .where(
          and(
            eq(organizationMembers.userId, input.targetUserId),
            eq(organizationMembers.organizationId, actorOrg.id),
          ),
        );
    });

    return { success: true };
  }

  /**
   * Alinea organizationMembers.role con users.role cuando el usuario pertenece a una entidad.
   * Preserva el rol "owner" del dueño de la entidad.
   */
  static async syncUserRoleWithOrganizationMembership(
    userId: string,
    globalRole: "member" | "organizer" | "admin" | "super_admin",
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
          : "member";

    if (!memberRow) {
      await db.insert(organizationMembers).values({
        organizationId: user.organizationId,
        userId,
        role: targetMemberRole,
      });
      return;
    }

    if (memberRow.role === "owner") return;

    if (memberRow.role !== targetMemberRole) {
      await db
        .update(organizationMembers)
        .set({ role: targetMemberRole })
        .where(eq(organizationMembers.id, memberRow.id));
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
      .where(eq(organizationMembers.organizationId, organizationId))
      .orderBy(asc(organizationMembers.createdAt));
  }

  static async getOrganizerIdsInOrg(organizationId: string) {
    const rows = await db
      .select({ userId: organizationMembers.userId })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          inArray(organizationMembers.role, ["owner", "organizer"]),
        ),
      );
    return rows.map((r) => r.userId);
  }

  static async countOrganizerSlotsInOrg(organizationId: string) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          inArray(organizationMembers.role, ["owner", "organizer"]),
        ),
      );
    return total ?? 0;
  }

  private static async assertCanAddOrganizerToOrg(organizationId: string) {
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
        `El plan ${plan.name} de esta entidad permite hasta ${plan.maxOrganizers} organizador(es). Actualiza el plan en facturación.`,
      );
    }
  }

  static async updateOrganizationName(input: {
    actorId: string;
    actorRole: string | null | undefined;
    organizationId: string;
    name: string;
  }) {
    const canEdit = await this.isOrgAdmin(input.actorId, input.actorRole);
    if (!canEdit) throw new Error("No autorizado para editar esta entidad");

    const name = input.name.trim();
    if (name.length < 2) {
      throw new Error("El nombre de la entidad debe tener al menos 2 caracteres");
    }

    const [updated] = await db
      .update(organizations)
      .set({ name, updatedAt: new Date() })
      .where(eq(organizations.id, input.organizationId))
      .returning();

    if (!updated) throw new Error("Entidad no encontrada");
    return updated;
  }

  static serializeSignupIntent(payload: SignupIntentPayload): string {
    return JSON.stringify(payload);
  }

  static parseSignupIntent(raw: string): SignupIntentPayload {
    try {
      const parsed = JSON.parse(raw) as SignupIntentPayload;
      if (parsed.type === "entity_admin" && parsed.orgName?.trim()) return parsed;
      if (parsed.type === "organizer") {
        const inviteCode = parsed.inviteCode?.trim();
        return inviteCode
          ? { type: "organizer", inviteCode }
          : { type: "organizer" };
      }
      if (parsed.type === "member") return parsed;
      if (parsed.type === "platform_owner") return parsed;
    } catch {
      // legacy plain string
    }
    if (raw === "organizer") return { type: "member" };
    return { type: "member" };
  }
}
