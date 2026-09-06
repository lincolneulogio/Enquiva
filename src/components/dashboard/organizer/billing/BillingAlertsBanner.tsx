"use client";

import { AlertTriangle, Clock } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { SubscriptionInfo } from "@/lib/billing/types";
import type { PendingPayment } from "./types";

interface BillingAlertsBannerProps {
  subscription: SubscriptionInfo;
  pendingPayment: PendingPayment | null;
  readOnly?: boolean;
  pageVariant?: "organizer" | "entity";
  displayPlanName: string;
  renewalDate: string;
  pendingPlanDate: string | null;
}

export function BillingAlertsBanner({
  subscription,
  pendingPayment,
  readOnly = false,
  pageVariant = "organizer",
  displayPlanName,
  renewalDate,
  pendingPlanDate,
}: BillingAlertsBannerProps) {
  const t = useTranslations();
  const { plan, billedPlan, renewalAlert, daysUntilRenewal } = subscription;

  return (
    <>
      {subscription.billingScope === "organization" && subscription.organizationName && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
          {readOnly
            ? t("billing.organizer.orgPlanReadOnly", { org: subscription.organizationName })
            : pageVariant === "entity"
              ? t("billing.entityPlan.orgScope", { org: subscription.organizationName })
              : t("billing.organizer.orgPlanManaged", { org: subscription.organizationName })}
        </div>
      )}

      {renewalAlert === "expiring_soon" && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium text-foreground">{t("billing.organizer.expiringTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("billing.organizer.expiringHelp", {
                plan: displayPlanName,
                date: renewalDate,
                days:
                  daysUntilRenewal != null && daysUntilRenewal >= 0
                    ? t("billing.organizer.expiringDays", { count: daysUntilRenewal })
                    : "",
              })}
            </p>
          </div>
        </div>
      )}

      {renewalAlert === "past_due" && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200/60 bg-rose-50/50 p-4 dark:border-rose-900/30 dark:bg-rose-950/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <div>
            <p className="font-medium text-foreground">{t("billing.organizer.pastDueTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("billing.organizer.pastDueHelp", {
                billed: billedPlan?.name ?? displayPlanName,
                date: renewalDate,
                active: plan.name,
              })}
            </p>
          </div>
        </div>
      )}

      {subscription.pendingPlan && pendingPlanDate && (
        <div className="flex items-start gap-3 rounded-2xl border border-sky-200/60 bg-sky-50/50 p-4 dark:border-sky-900/30 dark:bg-sky-950/20">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" />
          <div>
            <p className="font-medium text-foreground">
              {t("billing.organizer.scheduledPlanTitle")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("billing.organizer.scheduledPlanHelp", {
                current: displayPlanName,
                target: subscription.pendingPlan.name,
                date: pendingPlanDate,
              })}
            </p>
          </div>
        </div>
      )}

      {pendingPayment && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium text-foreground">
              {t("billing.organizer.pendingPaymentTitle", { plan: pendingPayment.plan.name })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("billing.organizer.pendingPaymentHelp", {
                amount: Number(pendingPayment.payment.amount).toFixed(2),
                method: pendingPayment.payment.method.toUpperCase(),
              })}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
