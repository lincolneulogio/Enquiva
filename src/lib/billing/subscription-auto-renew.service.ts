import { db, type DBTransaction } from "@/lib/db";
import { plans, subscriptions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createCulqiCard,
  createCulqiCharge,
  createCulqiCustomer,
  getPlatformCulqiCredentials,
} from "@/lib/culqi/client";
import type { CulqiUserProfile } from "@/lib/culqi/customer-data";
import { SubscriptionPaymentService } from "./subscription-payment.service";
import { SubscriptionService } from "./subscription.service";

export class SubscriptionAutoRenewService {
  static async saveCardFromToken(
    tx: DBTransaction,
    input: {
      userId: string;
      role?: string | null;
      customer: CulqiUserProfile;
      tokenId: string;
      enableAutoRenew: boolean;
    },
  ) {
    const creds = getPlatformCulqiCredentials();
    if (!creds) return;

    const [user] = await tx
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    const ctx = await import("./subscription-context").then((m) =>
      m.resolveSubscriptionBillingContext(input.userId, input.role ?? user?.role),
    );
    if (ctx.mode === "platform_unlimited") return;

    const [sub] = await tx
      .select()
      .from(subscriptions)
      .where(SubscriptionService.subscriptionWhere(ctx))
      .limit(1);
    if (!sub) return;

    let customerId = sub.culqiCustomerId;
    if (!customerId) {
      const customer = await createCulqiCustomer(input.customer, creds);
      customerId = customer.id;
    }

    const card = await createCulqiCard(
      { customerId, tokenId: input.tokenId },
      creds,
    );

    await tx
      .update(subscriptions)
      .set({
        culqiCustomerId: customerId,
        culqiCardId: card.id,
        culqiCardLastFour: card.last_four ?? null,
        culqiCardBrand: card.iin?.card_brand ?? null,
        autoRenewEnabled: input.enableAutoRenew,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, sub.id));
  }

  static async prepareAutoRenewCard(
    userId: string,
    customer: CulqiUserProfile,
    tokenId: string,
    role?: string | null,
  ) {
    return db.transaction(async (tx) => {
      await this.saveCardFromToken(tx, {
        userId,
        role,
        customer,
        tokenId,
        enableAutoRenew: true,
      });
    });
  }

  static async setAutoRenew(userId: string, enabled: boolean, role?: string | null) {
    const sub = await SubscriptionService.findSubscriptionForBillingUser(userId, role);

    if (!sub) throw new Error("Suscripción no encontrada");
    if (enabled && !sub.culqiCardId) {
      throw new Error("Guarda una tarjeta pagando con Culqi para activar la renovación automática.");
    }

    await db
      .update(subscriptions)
      .set({ autoRenewEnabled: enabled, updatedAt: new Date() })
      .where(eq(subscriptions.id, sub.id));

    return { success: true };
  }

  static async tryAutoRenewForUser(
    userId: string,
    customer: CulqiUserProfile,
    role?: string | null,
  ): Promise<boolean> {
    const sub = await SubscriptionService.findSubscriptionForBillingUser(userId, role);
    if (!sub) return false;

    const [plan] = await db.select().from(plans).where(eq(plans.id, sub.planId)).limit(1);
    if (!plan) return false;

    const subscription = sub;
    if (!subscription.autoRenewEnabled || !subscription.culqiCardId) return false;

    const amount = Number(plan.priceMonthly);
    if (amount <= 0 || plan.slug === "free") return false;

    const creds = getPlatformCulqiCredentials();
    if (!creds) return false;

    try {
      const charge = await createCulqiCharge(
        {
          amount,
          email: customer.email,
          sourceId: subscription.culqiCardId,
          recurrent: true,
          customer,
          description: `Renovación automática ${plan.name} - Evora`,
          metadata: {
            userId,
            planId: plan.id,
            type: "subscription_auto_renew",
          },
        },
        creds,
      );

      if (charge.outcome?.type !== "venta_exitosa") return false;

      await SubscriptionPaymentService.fulfillCulqiSubscriptionCharge({
        userId,
        planId: plan.id,
        planName: plan.name,
        amount,
        chargeId: charge.id,
      });

      return true;
    } catch (error) {
      console.error("[auto-renew]", userId, error);
      return false;
    }
  }

  static async processDueAutoRenewals(): Promise<number> {
    const now = new Date();
    if (!getPlatformCulqiCredentials()) return 0;

    const dueRows = await db
      .select({
        subscription: subscriptions,
        plan: plans,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.status, "active"));

    let renewed = 0;

    for (const row of dueRows) {
      const { subscription, plan } = row;
      if (subscription.currentPeriodEnd >= now) continue;
      if (!subscription.autoRenewEnabled || !subscription.culqiCardId) continue;
      if (Number(plan.priceMonthly) <= 0 || plan.slug === "free") continue;

      const [user] = await db
        .select({ email: users.email, name: users.name, phone: users.phone, address: users.address })
        .from(users)
        .where(eq(users.id, subscription.userId))
        .limit(1);

      if (!user?.email) continue;

      const ok = await this.tryAutoRenewForUser(subscription.userId, {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
      });
      if (ok) renewed += 1;
    }

    return renewed;
  }
}

export function isOrganizerSubscriptionBlocked(
  status: string,
  planSlug: string,
  priceMonthly: number,
): boolean {
  return status === "past_due" && planSlug !== "free" && Number(priceMonthly) > 0;
}
