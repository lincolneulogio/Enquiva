import { db } from "@/lib/db";
import { plans, subscriptions, users } from "@/lib/db/schema";
import { and, eq, gt, ne, sql } from "drizzle-orm";
import { env } from "@/env";
import { sendSubscriptionRenewalReminderEmail } from "@/lib/mail";
import { SubscriptionAutoRenewService } from "./subscription-auto-renew.service";

/** Días después del vencimiento en los que se reintenta auto-renew. */
export const AUTO_RENEW_RETRY_DAYS = [0, 1, 3, 5] as const;

/** Días de gracia para pago manual antes de bloquear. */
export const MANUAL_PAYMENT_GRACE_DAYS = 1;

/** Días después del vencimiento antes de bloquear si auto-renew falla. */
export const AUTO_RENEW_BLOCK_AFTER_DAYS = 5;

function daysSince(date: Date, from: Date): number {
  return Math.floor((from.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function billingUrl(): string {
  const base = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/organizer/billing`;
}

export class SubscriptionRenewalService {
  /** Email 7 días antes del vencimiento (una vez por período). */
  static async sendUpcomingRenewalReminders(): Promise<number> {
    const now = new Date();
    let sent = 0;

    const rows = await db
      .select({
        subscription: subscriptions,
        plan: plans,
        user: users,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .where(
        and(
          eq(subscriptions.status, "active"),
          ne(plans.slug, "free"),
          gt(sql`cast(${plans.priceMonthly} as numeric)`, sql`0`),
        ),
      );

    for (const row of rows) {
      const { subscription, plan, user } = row;
      if (!user.email) continue;
      if (subscription.currentPeriodEnd <= now) continue;

      const daysLeft = Math.ceil(
        (subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysLeft !== 7) continue;
      if (subscription.renewalReminderSentAt) continue;

      const renewalDate = subscription.currentPeriodEnd.toLocaleDateString("es-PE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      await sendSubscriptionRenewalReminderEmail({
        email: user.email,
        name: user.name,
        planName: plan.name,
        daysRemaining: daysLeft,
        renewalDate,
        billingUrl: billingUrl(),
        autoRenewEnabled: subscription.autoRenewEnabled,
      });

      const { NotificationService } = await import("@/lib/notifications/notification.service");

      await NotificationService.create({
        userId: user.id,
        type: "subscription_alert",
        title: "Tu plan vence pronto",
        message: `Tu plan ${plan.name} vence en ${daysLeft} días (${renewalDate}).`,
        metadata: {
          planId: plan.id,
          planName: plan.name,
          daysRemaining: daysLeft,
          renewalDate,
        },
      });

      await db
        .update(subscriptions)
        .set({ renewalReminderSentAt: now, updatedAt: now })
        .where(eq(subscriptions.id, subscription.id));

      sent += 1;
    }

    return sent;
  }

  /**
   * Procesa suscripciones vencidas: reintentos auto-renew y bloqueo past_due.
   */
  static async processExpiredPaidSubscriptions(): Promise<{
    autoRenewed: number;
    autoRenewAttempts: number;
    markedPastDue: number;
  }> {
    const now = new Date();
    let autoRenewed = 0;
    let autoRenewAttempts = 0;
    let markedPastDue = 0;

    const rows = await db
      .select({
        subscription: subscriptions,
        plan: plans,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(
        and(
          eq(subscriptions.status, "active"),
          ne(plans.slug, "free"),
          gt(sql`cast(${plans.priceMonthly} as numeric)`, sql`0`),
        ),
      );

    for (const row of rows) {
      const { subscription, plan } = row;
      if (subscription.currentPeriodEnd >= now) continue;

      const daysOver = daysSince(subscription.currentPeriodEnd, now);

      if (subscription.autoRenewEnabled && subscription.culqiCardId) {
        const shouldRetry = (AUTO_RENEW_RETRY_DAYS as readonly number[]).includes(daysOver);
        const attemptedToday =
          subscription.autoRenewLastAttemptAt &&
          isSameUtcDay(subscription.autoRenewLastAttemptAt, now);

        if (shouldRetry && !attemptedToday) {
          const [user] = await db
            .select({ email: users.email, name: users.name, phone: users.phone, address: users.address })
            .from(users)
            .where(eq(users.id, subscription.userId))
            .limit(1);

          if (user?.email) {
            autoRenewAttempts += 1;
            const ok = await SubscriptionAutoRenewService.tryAutoRenewForUser(
              subscription.userId,
              { name: user.name, email: user.email, phone: user.phone, address: user.address },
            );

            await db
              .update(subscriptions)
              .set({ autoRenewLastAttemptAt: now, updatedAt: now })
              .where(eq(subscriptions.id, subscription.id));

            if (ok) {
              autoRenewed += 1;
              continue;
            }
          }
        }

        if (daysOver >= AUTO_RENEW_BLOCK_AFTER_DAYS) {
          await db
            .update(subscriptions)
            .set({ status: "past_due", updatedAt: now })
            .where(eq(subscriptions.id, subscription.id));
          markedPastDue += 1;
        }
        continue;
      }

      if (daysOver >= MANUAL_PAYMENT_GRACE_DAYS) {
        await db
          .update(subscriptions)
          .set({ status: "past_due", updatedAt: now })
          .where(eq(subscriptions.id, subscription.id));
        markedPastDue += 1;
      }
    }

    return { autoRenewed, autoRenewAttempts, markedPastDue };
  }
}

export function clearRenewalTrackingFields() {
  return {
    renewalReminderSentAt: null,
    autoRenewLastAttemptAt: null,
  };
}
