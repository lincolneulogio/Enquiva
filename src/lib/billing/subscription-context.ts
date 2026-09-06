import { db } from "@/lib/db";
import { users, organizations, subscriptions } from "@/lib/db/schema";
import { and, eq, isNull, sql, type SQL } from "drizzle-orm";
import { normalizeRole } from "@/lib/auth/rbac";
import { addBillingMonth } from "./plan-change-policy";

export function isPaidPlanRow(plan: { slug: string; priceMonthly: string | number }) {
  return plan.slug !== "free" && Number(plan.priceMonthly) > 0;
}

export function addOneMonth(from = new Date()) {
  return addBillingMonth(from);
}

export type SubscriptionBillingContext =
  | { mode: "platform_unlimited" }
  | {
      mode: "organization";
      organizationId: string;
      organizationName: string;
      billingUserId: string;
    }
  | { mode: "user"; userId: string };

export async function resolveSubscriptionBillingContext(
  userId: string,
  role?: string | null,
): Promise<SubscriptionBillingContext> {
  if (normalizeRole(role) === "super_admin") {
    return { mode: "platform_unlimited" };
  }

  const [user] = await db
    .select({ organizationId: users.organizationId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.organizationId) {
    const [org] = await db
      .select({
        id: organizations.id,
        ownerId: organizations.ownerId,
        name: organizations.name,
      })
      .from(organizations)
      .where(eq(organizations.id, user.organizationId))
      .limit(1);

    if (org) {
      return {
        mode: "organization",
        organizationId: org.id,
        organizationName: org.name,
        billingUserId: org.ownerId,
      };
    }
  }

  return { mode: "user", userId };
}

/** Quién puede pagar o cambiar el plan (no solo consultarlo). */
export function canManageSubscriptionBilling(
  actorId: string,
  role: string | null | undefined,
  ctx: SubscriptionBillingContext,
): boolean {
  // El plan especial de plataforma no se gestiona ni se paga como suscripción SaaS.
  if (ctx.mode === "platform_unlimited") return false;
  if (ctx.mode === "user") {
    return normalizeRole(role) === "organizer" && actorId === ctx.userId;
  }
  return actorId === ctx.billingUserId;
}

export function getBillingUserId(ctx: SubscriptionBillingContext): string | null {
  if (ctx.mode === "organization") return ctx.billingUserId;
  if (ctx.mode === "user") return ctx.userId;
  return null;
}

export function subscriptionWhere(ctx: SubscriptionBillingContext): SQL {
  if (ctx.mode === "organization") {
    return eq(subscriptions.organizationId, ctx.organizationId);
  }
  if (ctx.mode === "user") {
    return and(eq(subscriptions.userId, ctx.userId), isNull(subscriptions.organizationId))!;
  }
  return sql`1 = 0`;
}

