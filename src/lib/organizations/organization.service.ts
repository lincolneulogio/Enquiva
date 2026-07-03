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
  | { type: "entity_admin"; orgName: string };

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

    const plan = await SubscriptionService.getSubscriptionPlanForUserId(org.ownerId);
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
      if (parsed.type === "organizer") return parsed;
      if (parsed.type === "member") return parsed;
    } catch {
      // legacy plain string
    }
    if (raw === "organizer") return { type: "organizer" };
    return { type: "member" };
  }
}
