import { db } from "@/lib/db";
import { plans, subscriptions, type Plan } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  mapPlanRow,
  PENDING_PLATFORM_SETUP_PLAN,
  isPendingPlatformSetupPlan,
} from "./plans";
import type { ResolvedPlan, SubscriptionInfo } from "./types";
import { isOrganizerSubscriptionBlocked } from "./subscription-auto-renew.service";
import {
  resolveSubscriptionBillingContext,
  canManageSubscriptionBilling,
  getBillingUserId,
  subscriptionWhere,
  isPaidPlanRow,
  addOneMonth,
  type SubscriptionBillingContext,
} from "./subscription-context";
import { SubscriptionPlansService } from "./subscription-plans.service";
import { SubscriptionUsageService } from "./subscription-usage.service";
import { SubscriptionLifecycleService } from "./subscription-lifecycle.service";

export class SubscriptionRetrievalService {
  static async ensureOrganizationSubscription(
    organizationId: string,
    billingUserId: string,
  ) {
    const [existing] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, organizationId))
      .limit(1);

    if (existing) return existing.id;

    const freePlan =
      (await SubscriptionPlansService.getPlanBySlug("free")) ??
      (await SubscriptionPlansService.ensureFreePlanExists());
    if (!freePlan) {
      return null;
    }

    const periodEnd = addOneMonth();

    const [created] = await db
      .insert(subscriptions)
      .values({
        userId: billingUserId,
        organizationId,
        planId: freePlan.id,
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      })
      .returning({ id: subscriptions.id });

    return created.id;
  }

  static async getOrganizationPlan(organizationId: string): Promise<ResolvedPlan> {
    const [existing] = await db
      .select({ plan: plans })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.organizationId, organizationId))
      .limit(1);

    if (existing?.plan) {
      return mapPlanRow(existing.plan);
    }

    return SubscriptionPlansService.getFreePlan();
  }

  static async getOrCreateSubscription(
    userId: string,
    role?: string | null,
  ): Promise<SubscriptionInfo> {
    const ctx = await resolveSubscriptionBillingContext(userId, role);

    if (ctx.mode === "platform_unlimited") {
      const specialPlan =
        await SubscriptionPlansService.ensurePlatformSpecialPlanExists();
      return {
        id: "platform",
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        plan: specialPlan,
        usage: await SubscriptionUsageService.getUsage(userId, ctx),
        renewalAlert: null,
        daysUntilRenewal: null,
        autoRenewEnabled: false,
        hasSavedCard: false,
        accessBlocked: false,
        billingScope: "platform",
        canManageBilling: false,
        plansConfigured: true,
      };
    }

    await SubscriptionLifecycleService.syncSubscriptionForContext(ctx);

    const [existing] = await db
      .select({
        subscription: subscriptions,
        plan: plans,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(subscriptionWhere(ctx))
      .limit(1);

    if (existing) {
      return this.buildSubscriptionInfo(
        userId,
        role,
        ctx,
        existing.subscription,
        existing.plan,
      );
    }

    const freePlan =
      (await SubscriptionPlansService.getPlanBySlug("free")) ??
      (await SubscriptionPlansService.ensureFreePlanExists());
    if (!freePlan) {
      return {
        id: "pending-setup",
        status: "pending_setup",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        plan: PENDING_PLATFORM_SETUP_PLAN,
        usage: await SubscriptionUsageService.getUsage(userId, ctx),
        renewalAlert: null,
        daysUntilRenewal: null,
        autoRenewEnabled: false,
        hasSavedCard: false,
        accessBlocked: false,
        billingScope: ctx.mode === "organization" ? "organization" : "user",
        canManageBilling: canManageSubscriptionBilling(userId, role, ctx),
        organizationName:
          ctx.mode === "organization" ? ctx.organizationName : null,
        plansConfigured: false,
      };
    }
    const periodEnd = addOneMonth();
    const billingUserId = getBillingUserId(ctx)!;

    const [created] = await db
      .insert(subscriptions)
      .values({
        userId: billingUserId,
        organizationId: ctx.mode === "organization" ? ctx.organizationId : null,
        planId: freePlan.id,
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      })
      .returning();

    const [planRow] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, freePlan.id))
      .limit(1);

    return this.buildSubscriptionInfo(
      userId,
      role,
      ctx,
      created,
      planRow as Plan,
    );
  }

  private static async buildSubscriptionInfo(
    userId: string,
    role: string | null | undefined,
    ctx: SubscriptionBillingContext,
    subscription: typeof subscriptions.$inferSelect,
    planRow: Plan,
  ): Promise<SubscriptionInfo> {
    const billedPlan = mapPlanRow(planRow);
    const now = new Date();
    const daysUntilRenewal = Math.ceil(
      (subscription.currentPeriodEnd.getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    let renewalAlert: SubscriptionInfo["renewalAlert"] = null;
    if (subscription.status === "past_due") {
      renewalAlert = "past_due";
    } else if (
      isPaidPlanRow(planRow) &&
      subscription.status === "active" &&
      daysUntilRenewal <= 7 &&
      daysUntilRenewal >= 0
    ) {
      renewalAlert = "expiring_soon";
    }

    const effectivePlan =
      subscription.status === "past_due"
        ? ((await SubscriptionPlansService.getPlanBySlug("free")) ??
          (await SubscriptionPlansService.ensureFreePlanExists()) ??
          PENDING_PLATFORM_SETUP_PLAN)
        : billedPlan;
    const plansConfigured = !isPendingPlatformSetupPlan(effectivePlan);

    const usage = await SubscriptionUsageService.getUsage(userId, ctx);
    const { getAiChatUsage } = await import("./ai-chat-usage");
    const aiUsage = await getAiChatUsage(userId, role, effectivePlan);
    const pendingPlanRow = subscription.pendingPlanId
      ? (
          await db
            .select()
            .from(plans)
            .where(eq(plans.id, subscription.pendingPlanId))
            .limit(1)
        )[0]
      : null;

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      plan: effectivePlan,
      billedPlan: subscription.status === "past_due" ? billedPlan : undefined,
      usage: { ...usage, aiMessagesThisMonth: aiUsage.used },
      renewalAlert,
      daysUntilRenewal,
      autoRenewEnabled: subscription.autoRenewEnabled,
      hasSavedCard: Boolean(subscription.culqiCardId),
      culqiCardLastFour: subscription.culqiCardLastFour,
      culqiCardBrand: subscription.culqiCardBrand,
      accessBlocked: isOrganizerSubscriptionBlocked(
        subscription.status,
        planRow.slug,
        Number(planRow.priceMonthly),
      ),
      billingScope: ctx.mode === "organization" ? "organization" : "user",
      canManageBilling: canManageSubscriptionBilling(userId, role, ctx),
      organizationName:
        ctx.mode === "organization" ? ctx.organizationName : null,
      pendingPlan: pendingPlanRow ? mapPlanRow(pendingPlanRow) : null,
      pendingPlanEffectiveAt: subscription.pendingPlanEffectiveAt,
      plansConfigured,
    };
  }
}
