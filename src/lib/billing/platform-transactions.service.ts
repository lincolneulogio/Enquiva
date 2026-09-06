import { db, type DBTransaction } from "@/lib/db";
import {
  platformTransactions,
  subscriptions,
  users,
  plans,
} from "@/lib/db/schema";
import {
  and,
  count,
  desc,
  eq,
  gt,
  ne,
  or,
  sql,
} from "drizzle-orm";

export class PlatformTransactionsService {
  static async getRevenueSummary(options?: { page?: number; pageSize?: number }) {
    const pageSize = options?.pageSize && options.pageSize > 0 ? Math.floor(options.pageSize) : 10;
    const requestedPage = Number(options?.page ?? 1);
    const page =
      Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
    const offset = (page - 1) * pageSize;

    const rows = await db
      .select({
        type: platformTransactions.type,
        total: sql<string>`coalesce(sum(${platformTransactions.amount}), 0)`,
      })
      .from(platformTransactions)
      .groupBy(platformTransactions.type);

    const [recent, [recentCount]] = await Promise.all([
      db
        .select()
        .from(platformTransactions)
        .orderBy(desc(platformTransactions.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ total: count() }).from(platformTransactions),
    ]);

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
      recentTotal: recentCount?.total ?? 0,
      recentPage: page,
      recentPageSize: pageSize,
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

    if (input.type === "commission" && input.paymentId) {
      const [existing] = await tx
        .select({ id: platformTransactions.id })
        .from(platformTransactions)
        .where(
          and(
            eq(platformTransactions.type, "commission"),
            eq(platformTransactions.paymentId, input.paymentId),
          ),
        )
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
