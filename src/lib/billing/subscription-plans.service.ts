import { db } from "@/lib/db";
import {
  plans,
  subscriptions,
  subscriptionPayments,
  type Plan,
} from "@/lib/db/schema";
import {
  and,
  eq,
  ne,
  notInArray,
  or,
} from "drizzle-orm";
import {
  CANONICAL_PLAN_SLUGS,
  FREE_PLAN_DEFINITION,
  mapPlanRow,
  PLATFORM_SPECIAL_PLAN_DEFINITION,
  PLATFORM_SPECIAL_PLAN_SLUG,
  UNLIMITED_PLAN,
  filterPublicBillingPlans,
  type PlanDefinitionSeed,
} from "./plans";
import type { ResolvedPlan } from "./types";

export class SubscriptionPlansService {
  private static planUpsertFields(definition: PlanDefinitionSeed) {
    return {
      name: definition.name,
      description: definition.description,
      priceMonthly: definition.priceMonthly,
      maxActiveEvents: definition.maxActiveEvents,
      maxAttendeesPerEvent: definition.maxAttendeesPerEvent,
      commissionPercent: definition.commissionPercent,
      commissionPerRegistration: definition.commissionPerRegistration,
      maxBroadcastsPerMonth: definition.maxBroadcastsPerMonth,
      maxAiMessagesPerMonth: definition.maxAiMessagesPerMonth,
      maxOrganizers: definition.maxOrganizers,
      featureCulqi: definition.featureCulqi,
      featureTransport: definition.featureTransport,
      featureAi: definition.featureAi,
      featureExports: definition.featureExports,
      featureCustomBranding: definition.featureCustomBranding,
      sortOrder: definition.sortOrder,
      updatedAt: new Date(),
    };
  }

  static async reclaimFreePlanSlug() {
    const [canonical] = await db
      .select({ id: plans.id })
      .from(plans)
      .where(eq(plans.slug, "free"))
      .limit(1);
    if (canonical) return;

    const [drifted] = await db
      .select({ id: plans.id })
      .from(plans)
      .where(
        and(
          ne(plans.slug, PLATFORM_SPECIAL_PLAN_SLUG),
          or(eq(plans.slug, "gratis"), and(eq(plans.priceMonthly, "0"), eq(plans.name, "Gratis"))),
        ),
      )
      .limit(1);

    if (!drifted) return;

    await db
      .update(plans)
      .set({ slug: "free", updatedAt: new Date() })
      .where(eq(plans.id, drifted.id));
  }

  static async syncFreePlanDefinition() {
    await this.reclaimFreePlanSlug();
    await db
      .insert(plans)
      .values(FREE_PLAN_DEFINITION)
      .onConflictDoUpdate({
        target: plans.slug,
        set: this.planUpsertFields(FREE_PLAN_DEFINITION),
      });
  }

  static async ensureFreePlanExists(): Promise<ResolvedPlan | null> {
    await this.reclaimFreePlanSlug();
    const existing = await this.getPlanBySlug("free");
    if (existing) return existing;

    await db.insert(plans).values(FREE_PLAN_DEFINITION).onConflictDoNothing();
    return this.getPlanBySlug("free");
  }

  static async ensurePlatformSpecialPlanExists(): Promise<ResolvedPlan> {
    const fields = {
      name: PLATFORM_SPECIAL_PLAN_DEFINITION.name,
      description: PLATFORM_SPECIAL_PLAN_DEFINITION.description,
      priceMonthly: PLATFORM_SPECIAL_PLAN_DEFINITION.priceMonthly,
      maxActiveEvents: PLATFORM_SPECIAL_PLAN_DEFINITION.maxActiveEvents,
      maxAttendeesPerEvent: PLATFORM_SPECIAL_PLAN_DEFINITION.maxAttendeesPerEvent,
      commissionPercent: PLATFORM_SPECIAL_PLAN_DEFINITION.commissionPercent,
      commissionPerRegistration: PLATFORM_SPECIAL_PLAN_DEFINITION.commissionPerRegistration,
      maxBroadcastsPerMonth: PLATFORM_SPECIAL_PLAN_DEFINITION.maxBroadcastsPerMonth,
      maxAiMessagesPerMonth: PLATFORM_SPECIAL_PLAN_DEFINITION.maxAiMessagesPerMonth,
      maxOrganizers: PLATFORM_SPECIAL_PLAN_DEFINITION.maxOrganizers,
      featureCulqi: PLATFORM_SPECIAL_PLAN_DEFINITION.featureCulqi,
      featureTransport: PLATFORM_SPECIAL_PLAN_DEFINITION.featureTransport,
      featureAi: PLATFORM_SPECIAL_PLAN_DEFINITION.featureAi,
      featureExports: PLATFORM_SPECIAL_PLAN_DEFINITION.featureExports,
      featureCustomBranding: PLATFORM_SPECIAL_PLAN_DEFINITION.featureCustomBranding,
      sortOrder: PLATFORM_SPECIAL_PLAN_DEFINITION.sortOrder,
      isActive: false,
      updatedAt: new Date(),
    };

    await db
      .insert(plans)
      .values({
        slug: PLATFORM_SPECIAL_PLAN_SLUG,
        ...fields,
      })
      .onConflictDoUpdate({
        target: plans.slug,
        set: fields,
      });

    return (await this.getPlanBySlug(PLATFORM_SPECIAL_PLAN_SLUG)) ?? UNLIMITED_PLAN;
  }

  static async ensureDefaultPlans() {
    await this.syncFreePlanDefinition();
    await this.ensurePlatformSpecialPlanExists();

    const [freeRow] = await db.select().from(plans).where(eq(plans.slug, "free")).limit(1);
    if (!freeRow) {
      throw new Error("No se pudo sincronizar el plan free.");
    }

    const extras = await db
      .select({ id: plans.id, slug: plans.slug, name: plans.name })
      .from(plans)
      .where(notInArray(plans.slug, [...CANONICAL_PLAN_SLUGS]));

    for (const extra of extras) {
      await db
        .update(subscriptions)
        .set({ planId: freeRow.id, updatedAt: new Date() })
        .where(eq(subscriptions.planId, extra.id));

      await db
        .update(subscriptionPayments)
        .set({ planId: freeRow.id })
        .where(eq(subscriptionPayments.planId, extra.id));

      await db.delete(plans).where(eq(plans.id, extra.id));
    }
  }

  static async getPlanBySlug(slug: string): Promise<ResolvedPlan | null> {
    const [plan] = await db.select().from(plans).where(eq(plans.slug, slug)).limit(1);
    return plan ? mapPlanRow(plan) : null;
  }

  static async getFreePlan(): Promise<ResolvedPlan> {
    const plan =
      (await this.getPlanBySlug("free")) ?? (await this.ensureFreePlanExists());
    if (!plan) {
      throw new Error(
        "Plan free no encontrado. Ejecuta pnpm db:seed:bootstrap o pnpm db:sync:plans.",
      );
    }
    return plan;
  }

  static async listAllPlans(): Promise<Plan[]> {
    return db.select().from(plans).orderBy(plans.sortOrder);
  }

  static async listPublicPlans(): Promise<Plan[]> {
    const all = await db
      .select()
      .from(plans)
      .where(eq(plans.isActive, true))
      .orderBy(plans.sortOrder);
    return filterPublicBillingPlans(all);
  }
}
