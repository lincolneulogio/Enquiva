"use server";

import { db } from "@/lib/db";
import { plans, subscriptions, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/actions/admin/users";
import { SubscriptionService } from "@/lib/billing/subscription.service";

export async function getAllPlans() {
  await requireSuperAdmin();
  await SubscriptionService.ensureDefaultPlans();
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
  maxOrganizers?: number | null;
  featureCulqi?: boolean;
  featureTransport?: boolean;
  featureAi?: boolean;
  featureExports?: boolean;
  featureCustomBranding?: boolean;
  sortOrder?: number;
}) {
  await requireSuperAdmin();

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
      maxOrganizers: input.maxOrganizers ?? null,
      featureCulqi: input.featureCulqi ?? false,
      featureTransport: input.featureTransport ?? false,
      featureAi: input.featureAi ?? false,
      featureExports: input.featureExports ?? false,
      featureCustomBranding: input.featureCustomBranding ?? false,
      sortOrder: input.sortOrder ?? 99,
      isActive: true,
    })
    .returning();

  revalidatePath("/admin/plans");
  return { success: true, plan: created };
}

export async function updatePlan(
  id: string,
  input: {
    name?: string;
    description?: string;
    priceMonthly?: number;
    maxActiveEvents?: number | null;
    maxAttendeesPerEvent?: number | null;
    commissionPercent?: number;
    maxBroadcastsPerMonth?: number | null;
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
  await requireSuperAdmin();

  await db
    .update(plans)
    .set({
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.description !== undefined && { description: input.description?.trim() ?? null }),
      ...(input.priceMonthly !== undefined && { priceMonthly: String(input.priceMonthly) }),
      ...(input.maxActiveEvents !== undefined && { maxActiveEvents: input.maxActiveEvents }),
      ...(input.maxAttendeesPerEvent !== undefined && { maxAttendeesPerEvent: input.maxAttendeesPerEvent }),
      ...(input.commissionPercent !== undefined && { commissionPercent: String(input.commissionPercent) }),
      ...(input.maxBroadcastsPerMonth !== undefined && { maxBroadcastsPerMonth: input.maxBroadcastsPerMonth }),
      ...(input.maxOrganizers !== undefined && { maxOrganizers: input.maxOrganizers }),
      ...(input.featureCulqi !== undefined && { featureCulqi: input.featureCulqi }),
      ...(input.featureTransport !== undefined && { featureTransport: input.featureTransport }),
      ...(input.featureAi !== undefined && { featureAi: input.featureAi }),
      ...(input.featureExports !== undefined && { featureExports: input.featureExports }),
      ...(input.featureCustomBranding !== undefined && { featureCustomBranding: input.featureCustomBranding }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      updatedAt: new Date(),
    })
    .where(eq(plans.id, id));

  revalidatePath("/admin/plans");
  revalidatePath("/organizer/billing");
  return { success: true };
}

export async function deletePlan(id: string) {
  await requireSuperAdmin();

  const [inUse] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.planId, id))
    .limit(1);

  if (inUse) throw new Error("No se puede eliminar: hay suscripciones usando este plan");

  await db.delete(plans).where(eq(plans.id, id));
  revalidatePath("/admin/plans");
  return { success: true };
}

export async function assignUserPlan(userId: string, planId: string) {
  const actor = await requireSuperAdmin();
  await SubscriptionService.assignPlanToUser(userId, planId, actor.role ?? "super_admin");
  revalidatePath("/admin/plans");
  revalidatePath("/admin/billing");
  revalidatePath("/organizer/billing");
  return { success: true };
}

export async function getOrganizersForPlanAssignment() {
  await requireSuperAdmin();
  return db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.role, "organizer"));
}

export async function getPlatformRevenue() {
  await requireSuperAdmin();
  return SubscriptionService.getRevenueSummary();
}
