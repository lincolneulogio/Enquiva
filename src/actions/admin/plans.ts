"use server";

import { db } from "@/lib/db";
import { plans, subscriptions } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/actions/admin/users";
import { SubscriptionService } from "@/lib/billing/subscription.service";
import {
  PLATFORM_SPECIAL_PLAN_SLUG,
  isPlatformSpecialPlan,
} from "@/lib/billing/plans";
import { logAdminAction } from "@/lib/analytics/log-admin-action";
import { assertPermission } from "@/lib/auth/permission-guards";
import {
  createPlanSchema,
  updatePlanSchema,
  type CreatePlanInput,
  type UpdatePlanInput,
} from "@/lib/validations";

export async function getAllPlans() {
  await requireSuperAdmin();
  await SubscriptionService.ensurePlatformSpecialPlanExists();
  return db.select().from(plans).orderBy(asc(plans.sortOrder));
}

export async function createPlan(input: CreatePlanInput) {
  const user = await requireSuperAdmin();
  await assertPermission(user, "plans:manage");
  const validated = createPlanSchema.parse(input);

  const [created] = await db
    .insert(plans)
    .values({
      slug: validated.slug,
      name: validated.name,
      description: validated.description ?? null,
      priceMonthly: String(validated.priceMonthly),
      maxActiveEvents: validated.maxActiveEvents ?? null,
      maxAttendeesPerEvent: validated.maxAttendeesPerEvent ?? null,
      commissionPercent: String(validated.commissionPercent ?? 0),
      commissionPerRegistration: String(validated.commissionPerRegistration ?? 0),
      maxBroadcastsPerMonth: validated.maxBroadcastsPerMonth ?? null,
      maxAiMessagesPerMonth: validated.maxAiMessagesPerMonth ?? null,
      maxOrganizers: validated.maxOrganizers ?? null,
      featureCulqi: validated.featureCulqi ?? false,
      featureTransport: validated.featureTransport ?? false,
      featureAi: validated.featureAi ?? false,
      featureExports: validated.featureExports ?? false,
      featureCustomBranding: validated.featureCustomBranding ?? false,
      sortOrder: validated.sortOrder ?? 99,
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

export async function updatePlan(id: string, input: UpdatePlanInput) {
  const user = await requireSuperAdmin();
  await assertPermission(user, "plans:manage");
  const validated = updatePlanSchema.parse(input);

  const [current] = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
  if (!current) throw new Error("Plan no encontrado");

  // Plan especial: solo permite ajustar nombre/descripción visual; límites se reponen.
  if (isPlatformSpecialPlan(current)) {
    await db
      .update(plans)
      .set({
        ...(validated.name !== undefined && { name: validated.name }),
        ...(validated.description !== undefined && {
          description: validated.description ?? null,
        }),
        slug: PLATFORM_SPECIAL_PLAN_SLUG,
        priceMonthly: "0",
        maxActiveEvents: null,
        maxAttendeesPerEvent: null,
        commissionPercent: "0",
        commissionPerRegistration: "0",
        maxBroadcastsPerMonth: null,
        maxAiMessagesPerMonth: null,
        maxOrganizers: null,
        featureCulqi: true,
        featureTransport: true,
        featureAi: true,
        featureExports: true,
        featureCustomBranding: true,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(plans.id, id));

    const [updatedSpecial] = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
    await logAdminAction({
      actorId: user.id,
      actorName: user.name ?? user.email,
      action: "plan.update",
      entityType: "plan",
      entityId: id,
      details: `Plan especial superadmin actualizado (límites ilimitados preservados)`,
    });
    revalidatePath("/admin/plans");
    revalidatePath("/organizer/billing");
    return { success: true, plan: updatedSpecial };
  }

  const isFreePlan = current.slug === "free" || current.slug === "gratis";

  let nextSlug: string | undefined;
  if (isFreePlan) {
    nextSlug = "free";
  } else if (validated.slug !== undefined) {
    nextSlug = validated.slug;
    if (isPlatformSpecialPlan(nextSlug) || nextSlug === "free") {
      throw new Error("Ese identificador está reservado");
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
      ...(validated.name !== undefined && { name: validated.name }),
      ...(validated.description !== undefined && {
        description: validated.description ?? null,
      }),
      ...(validated.priceMonthly !== undefined && {
        priceMonthly: String(validated.priceMonthly),
      }),
      ...(validated.maxActiveEvents !== undefined && {
        maxActiveEvents: validated.maxActiveEvents,
      }),
      ...(validated.maxAttendeesPerEvent !== undefined && {
        maxAttendeesPerEvent: validated.maxAttendeesPerEvent,
      }),
      ...(validated.commissionPercent !== undefined && {
        commissionPercent: String(validated.commissionPercent),
      }),
      ...(validated.commissionPerRegistration !== undefined && {
        commissionPerRegistration: String(validated.commissionPerRegistration),
      }),
      ...(validated.maxBroadcastsPerMonth !== undefined && {
        maxBroadcastsPerMonth: validated.maxBroadcastsPerMonth,
      }),
      ...(validated.maxAiMessagesPerMonth !== undefined && {
        maxAiMessagesPerMonth: validated.maxAiMessagesPerMonth,
      }),
      ...(validated.maxOrganizers !== undefined && {
        maxOrganizers: validated.maxOrganizers,
      }),
      ...(validated.featureCulqi !== undefined && { featureCulqi: validated.featureCulqi }),
      ...(validated.featureTransport !== undefined && {
        featureTransport: validated.featureTransport,
      }),
      ...(validated.featureAi !== undefined && { featureAi: validated.featureAi }),
      ...(validated.featureExports !== undefined && {
        featureExports: validated.featureExports,
      }),
      ...(validated.featureCustomBranding !== undefined && {
        featureCustomBranding: validated.featureCustomBranding,
      }),
      ...(validated.isActive !== undefined && { isActive: validated.isActive }),
      ...(validated.sortOrder !== undefined && { sortOrder: validated.sortOrder }),
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
    details: `Plan actualizado: ${validated.name ?? "campos varios"}`,
  });

  revalidatePath("/admin/plans");
  revalidatePath("/organizer/billing");
  return { success: true, plan: updated };
}

export async function deletePlan(id: string) {
  const user = await requireSuperAdmin();
  await assertPermission(user, "plans:manage");

  const [target] = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
  if (!target) throw new Error("Plan no encontrado");
  if (isPlatformSpecialPlan(target)) {
    throw new Error("No se puede eliminar el plan especial del superadministrador");
  }

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

export async function getPlatformRevenue(page = 1) {
  const user = await requireSuperAdmin();
  await assertPermission(user, "platform:billing:view");
  return SubscriptionService.getRevenueSummary({ page, pageSize: 10 });
}
