import { db, type DBTransaction } from "@/lib/db";
import { plans, subscriptions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isPlatformSpecialPlan } from "./plans";
import type { PlanChangePreview } from "./types";
import { clearRenewalTrackingFields } from "./subscription-renewal.service";
import {
  decidePlanChangeTiming,
  purchasedPeriodEnd,
} from "./plan-change-policy";
import {
  resolveSubscriptionBillingContext,
  canManageSubscriptionBilling,
  getBillingUserId,
  subscriptionWhere,
  addOneMonth,
  type SubscriptionBillingContext,
} from "./subscription-context";

export class SubscriptionAssignmentService {
  static async getPlanChangePreview(
    userId: string,
    targetPlanSlug: string,
    role?: string | null,
  ): Promise<PlanChangePreview | null> {
    const [targetPlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.slug, targetPlanSlug))
      .limit(1);
    if (!targetPlan) return null;

    const ctx = await resolveSubscriptionBillingContext(userId, role);

    const [row] = await db
      .select({
        subscription: subscriptions,
        plan: plans,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(subscriptionWhere(ctx))
      .limit(1);

    const now = new Date();
    const currentPlan =
      row?.plan ??
      (await db.select().from(plans).where(eq(plans.slug, "free")).limit(1))[0];
    if (!currentPlan) return null;

    const daysRemaining = row
      ? Math.max(
          0,
          Math.ceil(
            (row.subscription.currentPeriodEnd.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

    const isDifferentPlan = currentPlan.slug !== targetPlanSlug;
    const decision = row
      ? decidePlanChangeTiming({
          currentPrice: Number(currentPlan.priceMonthly),
          targetPrice: Number(targetPlan.priceMonthly),
          currentPlanId: currentPlan.id,
          targetPlanId: targetPlan.id,
          currentStatus: row.subscription.status,
          currentPeriodEnd: row.subscription.currentPeriodEnd,
          now,
        })
      : {
          timing: "immediate" as const,
          isDowngrade: false,
          hasActivePaidPeriod: false,
        };
    const targetIsPaid = Number(targetPlan.priceMonthly) > 0;
    const newPeriodEnd =
      decision.hasActivePaidPeriod && targetIsPaid
        ? addOneMonth(row!.subscription.currentPeriodEnd)
        : decision.timing === "scheduled"
          ? row!.subscription.currentPeriodEnd
          : addOneMonth(now);

    return {
      requiresConfirmation: Boolean(
        decision.hasActivePaidPeriod && isDifferentPlan && daysRemaining > 0,
      ),
      currentPlanName: currentPlan.name,
      targetPlanName: targetPlan.name,
      daysRemaining,
      newPeriodEnd: newPeriodEnd.toISOString(),
      effectiveAt:
        decision.timing === "scheduled" && row
          ? row.subscription.currentPeriodEnd.toISOString()
          : now.toISOString(),
      isDowngrade: decision.isDowngrade,
      timing: decision.timing,
      preservesRemainingDays: decision.hasActivePaidPeriod,
    };
  }

  static async assignPlanFromOrganizerPayment(
    actorUserId: string,
    actorRole: string | null | undefined,
    planId: string,
    options: { paymentReceived?: boolean } = {},
  ) {
    const ctx = await resolveSubscriptionBillingContext(actorUserId, actorRole);
    if (!canManageSubscriptionBilling(actorUserId, actorRole, ctx)) {
      throw new Error("No puedes gestionar el plan de esta entidad.");
    }
    const billingUserId = getBillingUserId(ctx);
    if (!billingUserId) throw new Error("Contexto de facturación inválido");

    return db.transaction(async (tx) =>
      this.assignPlanToContextTx(tx, ctx, planId, billingUserId, {
        paymentReceived: options.paymentReceived ?? true,
      }),
    );
  }

  static async assignPlanForPaymentUserTx(
    tx: DBTransaction,
    paymentUserId: string,
    planId: string,
  ) {
    const [user] = await tx
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, paymentUserId))
      .limit(1);
    const ctx = await resolveSubscriptionBillingContext(paymentUserId, user?.role);
    const billingUserId = getBillingUserId(ctx);
    if (!billingUserId) throw new Error("Contexto de facturación inválido");

    return this.assignPlanToContextTx(tx, ctx, planId, billingUserId, {
      paymentReceived: true,
    });
  }

  /** @deprecated Usar assignPlanToContextTx */
  static async assignPlanToUserTx(tx: DBTransaction, userId: string, planId: string) {
    return this.assignPlanForPaymentUserTx(tx, userId, planId);
  }

  static async assignPlanToContextTx(
    tx: DBTransaction,
    ctx: SubscriptionBillingContext,
    planId: string,
    billingUserId: string,
    options: { paymentReceived: boolean },
  ) {
    if (ctx.mode === "platform_unlimited") {
      throw new Error("El plan del superadministrador no se asigna por suscripción.");
    }

    const [plan] = await tx.select().from(plans).where(eq(plans.id, planId)).limit(1);
    if (!plan) throw new Error("Plan no encontrado");
    if (isPlatformSpecialPlan(plan)) {
      throw new Error("Este plan es interno y solo aplica al superadministrador");
    }

    const now = new Date();

    const [existingRow] = await tx
      .select({
        subscription: subscriptions,
        plan: plans,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(subscriptionWhere(ctx))
      .limit(1);
    const existing = existingRow?.subscription;
    const currentPlan = existingRow?.plan;

    const stillActive =
      existing &&
      existing.status === "active" &&
      existing.currentPeriodEnd > now;

    const isSamePlan = existing?.planId === planId;
    const decision =
      existing && currentPlan
        ? decidePlanChangeTiming({
            currentPrice: Number(currentPlan.priceMonthly),
            targetPrice: Number(plan.priceMonthly),
            currentPlanId: currentPlan.id,
            targetPlanId: plan.id,
            currentStatus: existing.status,
            currentPeriodEnd: existing.currentPeriodEnd,
            now,
          })
        : {
            timing: "immediate" as const,
            isDowngrade: false,
            hasActivePaidPeriod: false,
          };

    if (existing) {
      if (existing.pendingPlanId) {
        if (existing.pendingPlanId === planId) return existing.id;
        throw new Error("Ya existe un cambio de plan programado para esta suscripción.");
      }

      if (decision.timing === "scheduled") {
        const paidFuturePeriod =
          options.paymentReceived && Number(plan.priceMonthly) > 0;
        const periodEnd = paidFuturePeriod
          ? purchasedPeriodEnd({
              currentPeriodEnd: existing.currentPeriodEnd,
              now,
              hasActivePaidPeriod: decision.hasActivePaidPeriod,
              paymentReceived: true,
            })
          : existing.currentPeriodEnd;

        await tx
          .update(subscriptions)
          .set({
            pendingPlanId: planId,
            pendingPlanEffectiveAt: existing.currentPeriodEnd,
            currentPeriodEnd: periodEnd,
            updatedAt: now,
          })
          .where(eq(subscriptions.id, existing.id));

        return existing.id;
      }

      const periodEnd = purchasedPeriodEnd({
        currentPeriodEnd: existing.currentPeriodEnd,
        now,
        hasActivePaidPeriod: decision.hasActivePaidPeriod,
        paymentReceived: options.paymentReceived,
      });
      await tx
        .update(subscriptions)
        .set({
          planId,
          pendingPlanId: null,
          pendingPlanEffectiveAt: null,
          userId: billingUserId,
          status: "active",
          currentPeriodStart:
            isSamePlan && stillActive ? existing.currentPeriodStart : now,
          currentPeriodEnd: periodEnd,
          cancelledAt: null,
          ...clearRenewalTrackingFields(),
          updatedAt: now,
        })
        .where(eq(subscriptions.id, existing.id));

      return existing.id;
    }

    const [created] = await tx
      .insert(subscriptions)
      .values({
        userId: billingUserId,
        organizationId: ctx.mode === "organization" ? ctx.organizationId : null,
        planId,
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: addOneMonth(now),
      })
      .returning({ id: subscriptions.id });

    return created.id;
  }
}
