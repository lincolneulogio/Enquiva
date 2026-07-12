import { db } from "@/lib/db";
import {
  organizations,
  organizationMembers,
  users,
  type Organization,
} from "@/lib/db/schema";
import { and, eq, asc, count, inArray, or, ilike, desc } from "drizzle-orm";
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
    let lastError: unknown;

    while (attempts < 10) {
      try {
        const org = await db.transaction(async (trx) => {
          const [created] = await trx
            .insert(organizations)
            .values({
              name: input.name.trim(),
              slug,
              inviteCode,
              ownerId: input.ownerUserId,
            })
            .returning();

          await trx.insert(organizationMembers).values({
            organizationId: created.id,
            userId: input.ownerUserId,
            role: "owner",
          });

          await trx
            .update(users)
            .set({ organizationId: created.id, role: "admin", updatedAt: new Date() })
            .where(eq(users.id, input.ownerUserId));

          return created;
        });

        const { SubscriptionService } = await import("@/lib/billing/subscription.service");
        await SubscriptionService.ensureOrganizationSubscription(org.id, input.ownerUserId);

        return org;
      } catch (error) {
        lastError = error;
        const pgCode =
          typeof error === "object" && error && "code" in error
            ? String((error as { code?: string }).code)
            : "";
        const isUniqueConflict = pgCode === "23505";
        if (!isUniqueConflict) {
          throw error instanceof Error
            ? error
            : new Error("No se pudo crear la organización. Intenta de nuevo.");
        }
        attempts += 1;
        slug = `${baseSlug}-${attempts}`;
        inviteCode = randomInviteCode();
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("No se pudo crear la organización. Intenta con otro nombre.");
  }

  static async requestJoinOrganizationAsOrganizer(input: {
    userId: string;
    inviteCode: string;
  }) {
    const org = await this.getByInviteCode(input.inviteCode);
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

    await db
      .update(users)
      .set({ organizationId: org.id, role: "organizer", updatedAt: new Date() })
      .where(eq(users.id, input.userId));

    return org;
  }

  /** @deprecated Use requestJoinOrganizationAsOrganizer for invite-based joins. */
  static async joinOrganizationAsOrganizer(input: {
    userId: string;
    inviteCode: string;
  }) {
    return this.requestJoinOrganizationAsOrganizer(input);
  }

  private static async resolvePendingOrganizerRequestContext(input: {
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

    const actorOrg = await this.getOrganizationForUser(input.actorId);
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

    await this.assertCanAddOrganizerToOrg(actorOrg.id);

    const [target] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, input.targetUserId))
      .limit(1);
    if (!target) throw new Error("Usuario no encontrado.");

    await db.transaction(async (trx) => {
      await trx
        .update(organizationMembers)
        .set({ status: "active" })
        .where(eq(organizationMembers.id, memberRow.id));

      await trx
        .update(users)
        .set({ organizationId: actorOrg.id, role: "organizer", updatedAt: new Date() })
        .where(eq(users.id, input.targetUserId));
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

    const globalRole = input.newRole === "organizer" ? "organizer" : "member";
    const memberStatus = "active" as const;
    const memberRole = input.newRole;

    await db.transaction(async (trx) => {
      await trx
        .update(users)
        .set({
          role: globalRole,
          organizationId: actorOrg.id,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.targetUserId));

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
        status: "active",
      });
      return;
    }

    if (memberRow.role === "owner") return;

    const memberStatus = globalRole === "organizer" ? "active" : "active";

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

  private static buildOrgUsersAdminWhere(
    organizationId: string,
    filters: { search?: string; role?: string },
  ) {
    const orgMemberUserIds = db
      .select({ userId: organizationMembers.userId })
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, organizationId));

    const conditions = [
      or(eq(users.organizationId, organizationId), inArray(users.id, orgMemberUserIds)),
    ];

    if (filters.role) {
      conditions.push(
        eq(users.role, filters.role as "member" | "organizer" | "admin" | "super_admin"),
      );
    }

    const search = filters.search?.trim();
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(users.name, pattern),
          ilike(users.email, pattern),
          ilike(users.phone, pattern),
        )!,
      );
    }

    return and(...conditions);
  }

  private static orgUsersAdminMemberJoin(organizationId: string) {
    return and(
      eq(organizationMembers.userId, users.id),
      eq(organizationMembers.organizationId, organizationId),
    );
  }

  static async countOrganizationUsersForAdmin(
    organizationId: string,
    filters: { search?: string; role?: string } = {},
  ) {
    const where = this.buildOrgUsersAdminWhere(organizationId, filters);
    const [{ total }] = await db
      .select({ total: count() })
      .from(users)
      .leftJoin(organizationMembers, this.orgUsersAdminMemberJoin(organizationId))
      .where(where);

    return total ?? 0;
  }

  static async listOrganizationUsersForAdmin(input: {
    organizationId: string;
    search?: string;
    role?: string;
    limit: number;
    offset: number;
  }) {
    const where = this.buildOrgUsersAdminWhere(input.organizationId, input);
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        emailVerified: users.emailVerified,
        isActive: users.isActive,
        lastSeenAt: users.lastSeenAt,
        role: users.role,
        createdAt: users.createdAt,
        memberStatus: organizationMembers.status,
        memberRole: organizationMembers.role,
      })
      .from(users)
      .leftJoin(organizationMembers, this.orgUsersAdminMemberJoin(input.organizationId))
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(input.limit)
      .offset(input.offset);
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

  /** Valida código de invitación antes del registro (sin comprobar cupo; se valida al aprobar). */
  static async validateOrganizerInviteForSignup(inviteCode: string) {
    const org = await this.getByInviteCode(inviteCode);
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
        `El plan ${plan.name} de esta entidad permite hasta ${plan.maxOrganizers} organizador(es) de eventos (sin contar al administrador). Actualiza el plan en facturación.`,
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
