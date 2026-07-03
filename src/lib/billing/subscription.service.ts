import { db, type DBTransaction } from "@/lib/db";
import {
  plans,
  subscriptions,
  platformTransactions,
  events,
  broadcastLogs,
  type Plan,
} from "@/lib/db/schema";
import { and, count, desc, eq, gt, gte, inArray, ne, or, sql } from "drizzle-orm";
import { DEFAULT_PLAN_DEFINITIONS, mapPlanRow, UNLIMITED_PLAN } from "./plans";
import type { PlanUsage, ResolvedPlan, SubscriptionInfo } from "./types";
import { normalizeRole } from "@/lib/auth/rbac";
import { users } from "@/lib/db/schema";

const ACTIVE_EVENT_STATUSES = ["draft", "published"] as const;

export class SubscriptionService {
  static isPlatformStaff(role: string | null | undefined) {
    const normalized = normalizeRole(role);
    return normalized === "super_admin" || normalized === "admin";
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
    await this.ensureDefaultPlans();
    const plan = await this.getPlanBySlug("free");
    if (!plan) throw new Error("Plan free no encontrado. Ejecuta pnpm run db:seed:plans");
    return plan;
  }

  static async getUsage(userId: string): Promise<PlanUsage> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

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
    };
  }

  static async getOrCreateSubscription(userId: string, role?: string | null): Promise<SubscriptionInfo> {
    if (this.isPlatformStaff(role)) {
      return {
        id: "platform",
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        plan: UNLIMITED_PLAN,
        usage: await this.getUsage(userId),
      };
    }

    await this.ensureDefaultPlans();

    const [existing] = await db
      .select({
        subscription: subscriptions,
        plan: plans,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (existing) {
      return {
        id: existing.subscription.id,
        status: existing.subscription.status,
        currentPeriodStart: existing.subscription.currentPeriodStart,
        currentPeriodEnd: existing.subscription.currentPeriodEnd,
        plan: mapPlanRow(existing.plan),
        usage: await this.getUsage(userId),
      };
    }

    const freePlan = await this.getFreePlan();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const [created] = await db
      .insert(subscriptions)
      .values({
        userId,
        planId: freePlan.id,
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      })
      .returning();

    const [planRow] = await db.select().from(plans).where(eq(plans.id, freePlan.id)).limit(1);

    return {
      id: created.id,
      status: created.status,
      currentPeriodStart: created.currentPeriodStart,
      currentPeriodEnd: created.currentPeriodEnd,
      plan: mapPlanRow(planRow as Plan),
      usage: await this.getUsage(userId),
    };
  }

  static async getSubscriptionPlanForUserId(userId: string): Promise<ResolvedPlan> {
    await this.ensureDefaultPlans();

    const [existing] = await db
      .select({ plan: plans })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
      .limit(1);

    if (existing) return mapPlanRow(existing.plan);
    return this.getFreePlan();
  }

  static async assignPlanToUser(userId: string, planId: string, actorRole: string) {
    if (!this.isPlatformStaff(actorRole)) throw new Error("Forbidden");

    return db.transaction(async (tx) => this.assignPlanToUserTx(tx, userId, planId));
  }

  static async assignPlanToUserTx(tx: DBTransaction, userId: string, planId: string) {
    const [plan] = await tx.select().from(plans).where(eq(plans.id, planId)).limit(1);
    if (!plan) throw new Error("Plan no encontrado");

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const [existing] = await tx
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (existing) {
      await tx
        .update(subscriptions)
        .set({
          planId,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
          cancelledAt: null,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, existing.id));

      return existing.id;
    }

    const [created] = await tx
      .insert(subscriptions)
      .values({
        userId,
        planId,
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      })
      .returning({ id: subscriptions.id });

    return created.id;
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
