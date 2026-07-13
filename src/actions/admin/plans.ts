"use server";

import { db } from "@/lib/db";
import { plans, subscriptions } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/actions/admin/users";
import { SubscriptionService } from "@/lib/billing/subscription.service";
import { logAdminAction } from "@/lib/analytics/log-admin-action";
import { assertPermission } from "@/lib/auth/permission-guards";

export async function getAllPlans() {
  await requireSuperAdmin();
  return db.select().from(plans).orderBy(asc(plans.sortOrder));
}

export async function createPlan(input: {
  slug: string;
  name: string;
  description?: string;
  priceMonthly: number;
  maxActiveEvents?: number | null;
  maxAttendeesPerEvent?: number | null;
  commissionPercent?: number;
  maxBroadcastsPerMonth?: number | null;
  maxAiMessagesPerMonth?: number | null;
  maxOrganizers?: number | null;
  featureCulqi?: boolean;
  featureTransport?: boolean;
  featureAi?: boolean;
  featureExports?: boolean;
  featureCustomBranding?: boolean;
  sortOrder?: number;
}) {
  const user = await requireSuperAdmin();
  await assertPermission(user, "plans:manage");

  const slug = input.slug.trim().toLowerCase();
  if (!/^[a-z0-9_-]+$/.test(slug)) {
    throw new Error("Slug inválido");
  }

  const [created] = await db
    .insert(plans)
    .values({
      slug,
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
      priceMonthly: String(input.priceMonthly),
      maxActiveEvents: input.maxActiveEvents ?? null,
      maxAttendeesPerEvent: input.maxAttendeesPerEvent ?? null,
      commissionPercent: String(input.commissionPercent ?? 0),
      maxBroadcastsPerMonth: input.maxBroadcastsPerMonth ?? null,
      maxAiMessagesPerMonth: input.maxAiMessagesPerMonth ?? null,
      maxOrganizers: input.maxOrganizers ?? null,
      featureCulqi: input.featureCulqi ?? false,
      featureTransport: input.featureTransport ?? false,
      featureAi: input.featureAi ?? false,
      featureExports: input.featureExports ?? false,
      featureCustomBranding: false,
      sortOrder: input.sortOrder ?? 99,
      isActive: true,
    })
    .returning();

  await logAdminAction({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "plan.create",
    entityType: "plan",
    entityId: created.id,
    details: `Plan creado: ${created.name} (${created.slug})`,
  });

  revalidatePath("/admin/plans");
  revalidatePath("/organizer/billing");
  return { success: true, plan: created };
}

export async function updatePlan(
  id: string,
  input: {
    slug?: string;
    name?: string;
    description?: string;
    priceMonthly?: number;
    maxActiveEvents?: number | null;
    maxAttendeesPerEvent?: number | null;
    commissionPercent?: number;
    maxBroadcastsPerMonth?: number | null;
    maxAiMessagesPerMonth?: number | null;
    maxOrganizers?: number | null;
    featureCulqi?: boolean;
    featureTransport?: boolean;
    featureAi?: boolean;
    featureExports?: boolean;
    featureCustomBranding?: boolean;
    isActive?: boolean;
    sortOrder?: number;
  },
) {
  const user = await requireSuperAdmin();
  await assertPermission(user, "plans:manage");

  let nextSlug: string | undefined;
  if (input.slug !== undefined) {
    nextSlug = input.slug.trim().toLowerCase();
    if (!/^[a-z0-9_-]+$/.test(nextSlug)) {
      throw new Error("Slug inválido");
    }
    const [taken] = await db.select({ id: plans.id }).from(plans).where(eq(plans.slug, nextSlug)).limit(1);
    if (taken && taken.id !== id) {
      throw new Error("Ya existe un plan con ese slug");
    }
  }

  await db
    .update(plans)
    .set({
      ...(nextSlug !== undefined && { slug: nextSlug }),
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.description !== undefined && { description: input.description?.trim() ?? null }),
      ...(input.priceMonthly !== undefined && { priceMonthly: String(input.priceMonthly) }),
      ...(input.maxActiveEvents !== undefined && { maxActiveEvents: input.maxActiveEvents }),
      ...(input.maxAttendeesPerEvent !== undefined && { maxAttendeesPerEvent: input.maxAttendeesPerEvent }),
      ...(input.commissionPercent !== undefined && { commissionPercent: String(input.commissionPercent) }),
      ...(input.maxBroadcastsPerMonth !== undefined && { maxBroadcastsPerMonth: input.maxBroadcastsPerMonth }),
      ...(input.maxAiMessagesPerMonth !== undefined && { maxAiMessagesPerMonth: input.maxAiMessagesPerMonth }),
      ...(input.maxOrganizers !== undefined && { maxOrganizers: input.maxOrganizers }),
      ...(input.featureCulqi !== undefined && { featureCulqi: input.featureCulqi }),
      ...(input.featureTransport !== undefined && { featureTransport: input.featureTransport }),
      ...(input.featureAi !== undefined && { featureAi: input.featureAi }),
      ...(input.featureExports !== undefined && { featureExports: input.featureExports }),
      featureCustomBranding: false,
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      updatedAt: new Date(),
    })
    .where(eq(plans.id, id));

  const [updated] = await db.select().from(plans).where(eq(plans.id, id)).limit(1);

  await logAdminAction({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "plan.update",
    entityType: "plan",
    entityId: id,
    details: `Plan actualizado: ${input.name ?? "campos varios"}`,
  });

  revalidatePath("/admin/plans");
  revalidatePath("/organizer/billing");
  return { success: true, plan: updated };
}

export async function deletePlan(id: string) {
  const user = await requireSuperAdmin();
  await assertPermission(user, "plans:manage");

  const [inUse] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.planId, id))
    .limit(1);

  if (inUse) throw new Error("No se puede eliminar: hay suscripciones usando este plan");

  await db.delete(plans).where(eq(plans.id, id));

  await logAdminAction({
    actorId: user.id,
    actorName: user.name ?? user.email,
    action: "plan.delete",
    entityType: "plan",
    entityId: id,
    details: "Plan SaaS eliminado",
  });

  revalidatePath("/admin/plans");
  return { success: true };
}

export async function getPlatformRevenue() {
  const user = await requireSuperAdmin();
  await assertPermission(user, "platform:billing:view");
  return SubscriptionService.getRevenueSummary();
}
