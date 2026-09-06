import { db } from "@/lib/db";
import {
  plans,
  subscriptions,
  users,
} from "@/lib/db/schema";
import {
  and,
  eq,
  lt,
  lte,
  or,
  sql,
} from "drizzle-orm";
import {
  isPaidPlanRow,
  addOneMonth,
  subscriptionWhere,
  resolveSubscriptionBillingContext,
  getBillingUserId,
  type SubscriptionBillingContext,
} from "./subscription-context";
import { clearRenewalTrackingFields } from "./subscription-renewal.service";

export class SubscriptionLifecycleService {
  /** Sincroniza vencimiento según contexto de facturación (org o usuario). */
  static async syncSubscriptionForContext(ctx: SubscriptionBillingContext) {
    if (ctx.mode === "platform_unlimited") return;

    const billingUserId = getBillingUserId(ctx);
    if (!billingUserId) return;

    await this.applyDuePendingPlanForContext(ctx);

    const [row] = await db
      .select({
        subscription: subscriptions,
        plan: plans,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(subscriptionWhere(ctx))
      .limit(1);

    if (!row) return;

    const now = new Date();
    const { subscription, plan } = row;

    if (!isPaidPlanRow(plan)) {
      if (subscription.status === "active" && subscription.currentPeriodEnd < now) {
        await db
          .update(subscriptions)
          .set({
            currentPeriodStart: now,
            currentPeriodEnd: addOneMonth(now),
            updatedAt: now,
          })
          .where(eq(subscriptions.id, subscription.id));
      }
      return;
    }

    if (subscription.currentPeriodEnd >= now) return;

    if (subscription.status === "active") {
      const daysOver = Math.floor(
        (now.getTime() - subscription.currentPeriodEnd.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (subscription.autoRenewEnabled && subscription.culqiCardId) {
        const { AUTO_RENEW_RETRY_DAYS, AUTO_RENEW_BLOCK_AFTER_DAYS } = await import(
          "./subscription-renewal.service"
        );
        const shouldRetry = (AUTO_RENEW_RETRY_DAYS as readonly number[]).includes(daysOver);
        const attemptedToday =
          subscription.autoRenewLastAttemptAt &&
          subscription.autoRenewLastAttemptAt.getUTCFullYear() === now.getUTCFullYear() &&
          subscription.autoRenewLastAttemptAt.getUTCMonth() === now.getUTCMonth() &&
          subscription.autoRenewLastAttemptAt.getUTCDate() === now.getUTCDate();

        if (shouldRetry && !attemptedToday) {
          const [user] = await db
            .select({ email: users.email, name: users.name, phone: users.phone, address: users.address })
            .from(users)
            .where(eq(users.id, billingUserId))
            .limit(1);

          if (user?.email) {
            const { SubscriptionAutoRenewService } = await import("./subscription-auto-renew.service");
            const renewed = await SubscriptionAutoRenewService.tryAutoRenewForUser(billingUserId, {
              name: user.name,
              email: user.email,
              phone: user.phone,
              address: user.address,
            });
            await db
              .update(subscriptions)
              .set({ autoRenewLastAttemptAt: now, updatedAt: now })
              .where(eq(subscriptions.id, subscription.id));
            if (renewed) return;
          }
        }

        if (daysOver < AUTO_RENEW_BLOCK_AFTER_DAYS) return;
      } else {
        const { MANUAL_PAYMENT_GRACE_DAYS } = await import("./subscription-renewal.service");
        if (daysOver < MANUAL_PAYMENT_GRACE_DAYS) return;
      }

      await db
        .update(subscriptions)
        .set({ status: "past_due", updatedAt: now })
        .where(eq(subscriptions.id, subscription.id));
    }
  }

  static async applyDuePendingPlanForContext(ctx: SubscriptionBillingContext) {
    const now = new Date();
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          subscriptionWhere(ctx),
          sql`${subscriptions.pendingPlanId} IS NOT NULL`,
          lte(subscriptions.pendingPlanEffectiveAt, now),
        ),
      )
      .limit(1);

    if (!subscription?.pendingPlanId || !subscription.pendingPlanEffectiveAt) return false;
    return this.applyPendingPlanChange(subscription, now);
  }

  static async applyPendingPlanChange(
    subscription: typeof subscriptions.$inferSelect,
    now: Date,
  ) {
    if (!subscription.pendingPlanId || !subscription.pendingPlanEffectiveAt) return false;

    const [targetPlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, subscription.pendingPlanId))
      .limit(1);
    if (!targetPlan) return false;

    const effectiveAt = subscription.pendingPlanEffectiveAt;
    const periodEnd =
      subscription.currentPeriodEnd > effectiveAt
        ? subscription.currentPeriodEnd
        : addOneMonth(effectiveAt);

    const [updated] = await db
      .update(subscriptions)
      .set({
        planId: targetPlan.id,
        pendingPlanId: null,
        pendingPlanEffectiveAt: null,
        status: "active",
        currentPeriodStart: effectiveAt,
        currentPeriodEnd: periodEnd,
        cancelledAt: null,
        ...(isPaidPlanRow(targetPlan)
          ? {}
          : { autoRenewEnabled: false }),
        ...clearRenewalTrackingFields(),
        updatedAt: now,
      })
      .where(
        and(
          eq(subscriptions.id, subscription.id),
          eq(subscriptions.pendingPlanId, targetPlan.id),
          lte(subscriptions.pendingPlanEffectiveAt, now),
        ),
      )
      .returning({ id: subscriptions.id });

    return Boolean(updated);
  }

  /** @deprecated Usar syncSubscriptionForContext */
  static async syncSubscriptionForUser(userId: string) {
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const ctx = await resolveSubscriptionBillingContext(userId, user?.role);
    return this.syncSubscriptionForContext(ctx);
  }

  /**
   * Job batch: marca past_due al vencer y hace downgrade a Free.
   * Ejecutar diariamente vía cron o script.
   */
  static async processSubscriptionLifecycle() {
    const now = new Date();

    const duePlanChanges = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          sql`${subscriptions.pendingPlanId} IS NOT NULL`,
          lte(subscriptions.pendingPlanEffectiveAt, now),
        ),
      );
    let appliedPlanChanges = 0;
    for (const subscription of duePlanChanges) {
      if (await this.applyPendingPlanChange(subscription, now)) {
        appliedPlanChanges += 1;
      }
    }

    const { SubscriptionRenewalService } = await import("./subscription-renewal.service");
    const remindersSent = await SubscriptionRenewalService.sendUpcomingRenewalReminders();
    const expiredResult = await SubscriptionRenewalService.processExpiredPaidSubscriptions();

    let renewedFree = 0;

    const expiredFree = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(
        and(
          eq(subscriptions.status, "active"),
          or(eq(plans.slug, "free"), eq(plans.priceMonthly, "0")),
          lt(subscriptions.currentPeriodEnd, now),
        ),
      );

    for (const row of expiredFree) {
      await db
        .update(subscriptions)
        .set({
          currentPeriodStart: now,
          currentPeriodEnd: addOneMonth(now),
          updatedAt: now,
        })
        .where(eq(subscriptions.id, row.id));
      renewedFree += 1;
    }

    return {
      remindersSent,
      autoRenewed: expiredResult.autoRenewed,
      autoRenewAttempts: expiredResult.autoRenewAttempts,
      markedPastDue: expiredResult.markedPastDue,
      appliedPlanChanges,
      renewedFree,
      processed:
        expiredResult.markedPastDue +
        expiredResult.autoRenewed +
        renewedFree +
        appliedPlanChanges,
    };
  }
}
