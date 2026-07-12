import { db, type DBTransaction } from "@/lib/db";
import {
  plans,
  subscriptions,
  platformTransactions,
  events,
  broadcastLogs,
  type Plan,
} from "@/lib/db/schema";
import { and, count, desc, eq, gt, gte, inArray, isNull, lt, ne, or, sql, type SQL } from "drizzle-orm";
import { DEFAULT_PLAN_DEFINITIONS, mapPlanRow, UNLIMITED_PLAN } from "./plans";
import type { PlanUsage, PlanChangePreview, ResolvedPlan, SubscriptionInfo } from "./types";
import { isOrganizerSubscriptionBlocked } from "./subscription-auto-renew.service";
import { clearRenewalTrackingFields } from "./subscription-renewal.service";
import { normalizeRole } from "@/lib/auth/rbac";
import { users, organizationMembers } from "@/lib/db/schema";
import {
  resolveSubscriptionBillingContext,
  canManageSubscriptionBilling,
  getBillingUserId,
  type SubscriptionBillingContext,
} from "./subscription-context";

const ACTIVE_EVENT_STATUSES = ["draft", "published"] as const;

function isPaidPlanRow(plan: { slug: string; priceMonthly: string | number }) {
  return plan.slug !== "free" && Number(plan.priceMonthly) > 0;
}

function addOneMonth(from = new Date()) {
  const periodEnd = new Date(from);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  return periodEnd;
}

export class SubscriptionService {
  /** Solo super_admin de plataforma tiene plan ilimitado sin facturación. */
  static isPlatformStaff(role: string | null | undefined) {
    return normalizeRole(role) === "super_admin";
  }

  static subscriptionWhere(ctx: SubscriptionBillingContext): SQL {
    if (ctx.mode === "organization") {
      return eq(subscriptions.organizationId, ctx.organizationId);
    }
    if (ctx.mode === "user") {
      return and(eq(subscriptions.userId, ctx.userId), isNull(subscriptions.organizationId))!;
    }
    return sql`1 = 0`;
  }

  static async ensureOrganizationSubscription(organizationId: string, billingUserId: string) {
    const [existing] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.organizationId, organizationId))
      .limit(1);

    if (existing) return existing.id;

    const freePlan = await this.getFreePlan();
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
    const [row] = await db
      .select({ plan: plans, status: subscriptions.status })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.organizationId, organizationId))
      .limit(1);

    if (!row || row.status !== "active") {
      return this.getFreePlan();
    }
    return mapPlanRow(row.plan);
  }

  static async ensureDefaultPlans() {
    for (const definition of DEFAULT_PLAN_DEFINITIONS) {
      await db
        .insert(plans)
        .values(definition)
        .onConflictDoUpdate({
          target: plans.slug,
          set: {
            name: definition.name,
            description: definition.description,
            priceMonthly: definition.priceMonthly,
            maxActiveEvents: definition.maxActiveEvents,
            maxAttendeesPerEvent: definition.maxAttendeesPerEvent,
            commissionPercent: definition.commissionPercent,
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
          },
        });
    }
  }

  static async getPlanBySlug(slug: string): Promise<ResolvedPlan | null> {
    const [plan] = await db.select().from(plans).where(eq(plans.slug, slug)).limit(1);
    return plan ? mapPlanRow(plan) : null;
  }

  static async getFreePlan(): Promise<ResolvedPlan> {
    const plan = await this.getPlanBySlug("free");
    if (!plan) {
      throw new Error(
        "Plan free no encontrado. Créalo desde el panel superadmin (Planes) o ejecuta pnpm db:sync:plans si quieres el seed opcional.",
      );
    }
    return plan;
  }

  static async getUsage(userId: string, ctx?: SubscriptionBillingContext): Promise<PlanUsage> {
    const billingCtx = ctx ?? (await resolveSubscriptionBillingContext(userId, null));
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    if (billingCtx.mode === "organization") {
      const memberRows = await db
        .select({ userId: organizationMembers.userId })
        .from(organizationMembers)
        .where(eq(organizationMembers.organizationId, billingCtx.organizationId));

      const memberIds = memberRows.map((row) => row.userId);
      if (memberIds.length === 0) {
        return { activeEvents: 0, broadcastsThisMonth: 0, aiMessagesThisMonth: 0 };
      }

      const [[eventsRow], [broadcastRow]] = await Promise.all([
        db
          .select({ total: count() })
          .from(events)
          .where(
            and(
              eq(events.organizationId, billingCtx.organizationId),
              inArray(events.status, [...ACTIVE_EVENT_STATUSES]),
            ),
          ),
        db
          .select({ total: count() })
          .from(broadcastLogs)
          .where(
            and(
              inArray(broadcastLogs.senderId, memberIds),
              gte(broadcastLogs.createdAt, monthStart),
            ),
          ),
      ]);

      return {
        activeEvents: eventsRow?.total ?? 0,
        broadcastsThisMonth: broadcastRow?.total ?? 0,
        aiMessagesThisMonth: 0,
      };
    }

    const [[eventsRow], [broadcastRow]] = await Promise.all([
      db
        .select({ total: count() })
        .from(events)
        .where(
          and(
            eq(events.organizerId, userId),
            inArray(events.status, [...ACTIVE_EVENT_STATUSES]),
          ),
        ),
      db
        .select({ total: count() })
        .from(broadcastLogs)
        .where(and(eq(broadcastLogs.senderId, userId), gte(broadcastLogs.createdAt, monthStart))),
    ]);

    return {
      activeEvents: eventsRow?.total ?? 0,
      broadcastsThisMonth: broadcastRow?.total ?? 0,
      aiMessagesThisMonth: 0,
    };
  }

  static async getOrCreateSubscription(userId: string, role?: string | null): Promise<SubscriptionInfo> {
    const ctx = await resolveSubscriptionBillingContext(userId, role);

    if (ctx.mode === "platform_unlimited") {
      return {
        id: "platform",
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        plan: UNLIMITED_PLAN,
        usage: await this.getUsage(userId, ctx),
        renewalAlert: null,
        daysUntilRenewal: null,
        autoRenewEnabled: false,
        hasSavedCard: false,
        accessBlocked: false,
        billingScope: "platform",
        canManageBilling: true,
      };
    }

    await this.syncSubscriptionForContext(ctx);

    const [existing] = await db
      .select({
        subscription: subscriptions,
        plan: plans,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(this.subscriptionWhere(ctx))
      .limit(1);

    if (existing) {
      return this.buildSubscriptionInfo(userId, role, ctx, existing.subscription, existing.plan);
    }

    const freePlan = await this.getFreePlan();
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

    const [planRow] = await db.select().from(plans).where(eq(plans.id, freePlan.id)).limit(1);

    return this.buildSubscriptionInfo(userId, role, ctx, created, planRow as Plan);
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
      (subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
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
      subscription.status === "past_due" ? await this.getFreePlan() : billedPlan;

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      plan: effectivePlan,
      billedPlan: subscription.status === "past_due" ? billedPlan : undefined,
      usage: await this.getUsage(userId, ctx),
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
      organizationName: ctx.mode === "organization" ? ctx.organizationName : null,
    };
  }

  /** Sincroniza vencimiento según contexto de facturación (org o usuario). */
  static async syncSubscriptionForContext(ctx: SubscriptionBillingContext) {
    if (ctx.mode === "platform_unlimited") return;

    const billingUserId = getBillingUserId(ctx);
    if (!billingUserId) return;

    const [row] = await db
      .select({
        subscription: subscriptions,
        plan: plans,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(this.subscriptionWhere(ctx))
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
          "./subscription-renewal.service",
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
      renewedFree,
      processed: expiredResult.markedPastDue + expiredResult.autoRenewed + renewedFree,
    };
  }

  static async getSubscriptionPlanForUserId(
    userId: string,
    role?: string | null,
  ): Promise<ResolvedPlan> {
    const info = await this.getOrCreateSubscription(userId, role);
    return info.plan;
  }

  /** Vista previa para confirmar cambio de plan (organizador o admin de entidad). */
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
      .where(this.subscriptionWhere(ctx))
      .limit(1);

    const now = new Date();
    const currentPlan = row?.plan ?? (await db.select().from(plans).where(eq(plans.slug, "free")).limit(1))[0];
    if (!currentPlan) return null;

    const daysRemaining = row
      ? Math.max(
          0,
          Math.ceil(
            (row.subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

    const isActivePaid =
      row &&
      row.subscription.status === "active" &&
      isPaidPlanRow(row.plan) &&
      row.subscription.currentPeriodEnd > now;

    const isDifferentPlan = currentPlan.slug !== targetPlanSlug;
    const isDowngrade =
      targetPlan.slug === "free" ||
      Number(targetPlan.priceMonthly) < Number(currentPlan.priceMonthly);

    const newPeriodEnd = addOneMonth(now);

    return {
      requiresConfirmation: Boolean(isActivePaid && isDifferentPlan && daysRemaining > 0),
      currentPlanName: currentPlan.name,
      targetPlanName: targetPlan.name,
      daysRemaining,
      newPeriodEnd: newPeriodEnd.toISOString(),
      isDowngrade,
    };
  }

  static async assignPlanFromOrganizerPayment(
    actorUserId: string,
    actorRole: string | null | undefined,
    planId: string,
  ) {
    const ctx = await resolveSubscriptionBillingContext(actorUserId, actorRole);
    if (!canManageSubscriptionBilling(actorUserId, actorRole, ctx)) {
      throw new Error("No puedes gestionar el plan de esta entidad.");
    }
    const billingUserId = getBillingUserId(ctx);
    if (!billingUserId) throw new Error("Contexto de facturación inválido");

    return db.transaction(async (tx) =>
      this.assignPlanToContextTx(tx, ctx, planId, billingUserId),
    );
  }

  static async assignPlanToUser(userId: string, planId: string, actorRole: string) {
    if (normalizeRole(actorRole) !== "super_admin") throw new Error("Forbidden");

    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const ctx = await resolveSubscriptionBillingContext(userId, user?.role);
    const billingUserId = getBillingUserId(ctx);
    if (!billingUserId) throw new Error("Contexto de facturación inválido");

    return db.transaction(async (tx) =>
      this.assignPlanToContextTx(tx, ctx, planId, billingUserId),
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

    return this.assignPlanToContextTx(tx, ctx, planId, billingUserId);
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
  ) {
    const [plan] = await tx.select().from(plans).where(eq(plans.id, planId)).limit(1);
    if (!plan) throw new Error("Plan no encontrado");

    const now = new Date();

    const [existing] = await tx
      .select()
      .from(subscriptions)
      .where(this.subscriptionWhere(ctx))
      .limit(1);

    const stillActive =
      existing &&
      existing.status === "active" &&
      existing.currentPeriodEnd > now;

    const isSamePlan = existing?.planId === planId;

    const periodStart =
      existing && isSamePlan && stillActive ? existing.currentPeriodStart : now;
    const periodEnd =
      existing && isSamePlan && stillActive
        ? addOneMonth(existing.currentPeriodEnd)
        : addOneMonth(now);

    if (existing) {
      await tx
        .update(subscriptions)
        .set({
          planId,
          userId: billingUserId,
          status: "active",
          currentPeriodStart: periodStart,
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
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      })
      .returning({ id: subscriptions.id });

    return created.id;
  }

  static async findSubscriptionRow(ctx: SubscriptionBillingContext) {
    const [row] = await db
      .select()
      .from(subscriptions)
      .where(this.subscriptionWhere(ctx))
      .limit(1);
    return row ?? null;
  }

  static async findSubscriptionForBillingUser(userId: string, role?: string | null) {
    const ctx = await resolveSubscriptionBillingContext(userId, role);
    if (ctx.mode === "platform_unlimited") return null;
    return this.findSubscriptionRow(ctx);
  }

  static async listAllPlans(): Promise<Plan[]> {
    return db.select().from(plans).orderBy(plans.sortOrder);
  }

  static async getRevenueSummary() {
    const rows = await db
      .select({
        type: platformTransactions.type,
        total: sql<string>`coalesce(sum(${platformTransactions.amount}), 0)`,
      })
      .from(platformTransactions)
      .groupBy(platformTransactions.type);

    const recent = await db
      .select()
      .from(platformTransactions)
      .orderBy(desc(platformTransactions.createdAt))
      .limit(20);

    const organizerActive = and(
      eq(subscriptions.status, "active"),
      eq(users.role, "organizer"),
    );

    const paidPlan = and(
      ne(plans.slug, "free"),
      gt(sql`cast(${plans.priceMonthly} as numeric)`, sql`0`),
    );

    const freePlan = or(eq(plans.slug, "free"), eq(plans.priceMonthly, "0"));

    const [[paidOrganizers], [freeOrganizers], [totalOrganizers]] = await Promise.all([
      db
        .select({ total: count() })
        .from(subscriptions)
        .innerJoin(users, eq(subscriptions.userId, users.id))
        .innerJoin(plans, eq(subscriptions.planId, plans.id))
        .where(and(organizerActive, paidPlan)),
      db
        .select({ total: count() })
        .from(subscriptions)
        .innerJoin(users, eq(subscriptions.userId, users.id))
        .innerJoin(plans, eq(subscriptions.planId, plans.id))
        .where(and(organizerActive, freePlan)),
      db
        .select({ total: count() })
        .from(subscriptions)
        .innerJoin(users, eq(subscriptions.userId, users.id))
        .innerJoin(plans, eq(subscriptions.planId, plans.id))
        .where(organizerActive),
    ]);

    return {
      totals: rows,
      recent,
      paidOrganizerSubscriptions: paidOrganizers?.total ?? 0,
      freeOrganizerSubscriptions: freeOrganizers?.total ?? 0,
      activeSubscriptions: totalOrganizers?.total ?? 0,
    };
  }

  static async recordPlatformTransaction(input: {
    type: "subscription" | "commission" | "adjustment";
    amount: number;
    currency?: string;
    userId?: string;
    paymentId?: string;
    subscriptionId?: string;
    subscriptionPaymentId?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }) {
    await db.transaction(async (tx) => this.recordPlatformTransactionTx(tx, input));
  }

  static async recordPlatformTransactionTx(
    tx: DBTransaction,
    input: {
      type: "subscription" | "commission" | "adjustment";
      amount: number;
      currency?: string;
      userId?: string;
      paymentId?: string;
      subscriptionId?: string;
      subscriptionPaymentId?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    if (input.subscriptionPaymentId) {
      const [existing] = await tx
        .select({ id: platformTransactions.id })
        .from(platformTransactions)
        .where(eq(platformTransactions.subscriptionPaymentId, input.subscriptionPaymentId))
        .limit(1);

      if (existing) return existing.id;
    }

    const [created] = await tx
      .insert(platformTransactions)
      .values({
        type: input.type,
        amount: String(input.amount),
        currency: input.currency ?? "PEN",
        userId: input.userId,
        paymentId: input.paymentId,
        subscriptionId: input.subscriptionId,
        subscriptionPaymentId: input.subscriptionPaymentId,
        description: input.description,
        metadata: input.metadata,
      })
      .returning({ id: platformTransactions.id });

    return created.id;
  }
}
