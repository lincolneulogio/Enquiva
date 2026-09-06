import { db } from "@/lib/db";
import {
  organizations,
  organizationMembers,
  users,
  type Organization,
} from "@/lib/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { normalizeRole } from "@/lib/auth/rbac";
import { slugify, randomInviteCode } from "./organization-utils";

export class OrganizationCoreService {
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
}
