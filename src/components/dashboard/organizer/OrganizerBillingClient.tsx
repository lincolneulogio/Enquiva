"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { requestPlanUpgrade } from "@/actions/billing";
import { Check, Crown, Loader2, Sparkles, Clock, AlertTriangle, History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Plan, PaymentMethod, SubscriptionPayment } from "@/lib/db/schema";
import type { SubscriptionInfo } from "@/lib/billing/types";
import { PlanUpgradeCheckout } from "@/components/dashboard/organizer/PlanUpgradeCheckout";
import { PlanChangeConfirmDialog } from "@/components/dashboard/organizer/PlanChangeConfirmDialog";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import type { PlanChangePreview } from "@/lib/billing/types";

interface PendingPayment {
  payment: {
    id: string;
    amount: string;
    method: string;
    createdAt: Date;
  };
  plan: Plan;
}

interface PaymentHistoryRow {
  payment: SubscriptionPayment;
  plan: Plan;
}

interface OrganizerBillingClientProps {
  subscription: SubscriptionInfo;
  availablePlans: Plan[];
  platformMethods: PaymentMethod[];
  culqiPublicKey: string | null;
  userEmail: string | null;
  pendingPayment: PendingPayment | null;
  paymentHistory: PaymentHistoryRow[];
}

const PAYMENT_STATUS_KEYS: Record<string, string> = {
  pending: "billing.organizer.statusPending",
  approved: "billing.organizer.statusApproved",
  rejected: "billing.organizer.statusRejected",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
  approved: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
  rejected: "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400",
};

export function OrganizerBillingClient({
  subscription,
  availablePlans,
  platformMethods,
  culqiPublicKey,
  userEmail,
  pendingPayment,
  paymentHistory,
}: OrganizerBillingClientProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [checkoutPlan, setCheckoutPlan] = useState<{
    plan: Plan;
    newPeriodEnd: string | null;
  } | null>(null);
  const [planChangeConfirm, setPlanChangeConfirm] = useState<{
    target: Plan;
    preview: PlanChangePreview;
  } | null>(null);
  const { plan, usage, billedPlan, renewalAlert, daysUntilRenewal } = subscription;
  const displayPlanName = billedPlan?.name ?? plan.name;

  const proceedPlanChange = (target: Plan, confirmed: boolean) => {
    startTransition(async () => {
      try {
        const res = await requestPlanUpgrade(target.slug, confirmed);
        if (res.mode === "confirm" && res.preview) {
          setPlanChangeConfirm({ target, preview: res.preview });
          return;
        }
        if (res.mode === "assigned") {
          setPlanChangeConfirm(null);
          toast.success(t("billing.organizer.planUpdated"));
          window.location.reload();
        } else if (res.mode === "checkout") {
          setPlanChangeConfirm(null);
          setCheckoutPlan({
            plan: target,
            newPeriodEnd: res.preview?.newPeriodEnd ?? null,
          });
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("billing.organizer.planChangeFailed"));
      }
    });
  };

  const onSelectPlan = (target: Plan) => {
    if (target.slug === plan.slug && !billedPlan) return;
    if (pendingPayment) {
      toast.info(t("billing.organizer.pendingExists"));
      return;
    }
    proceedPlanChange(target, false);
  };

  const dateLocale = locale === "en" ? "en-US" : "es-PE";
  const renewalDate = new Date(subscription.currentPeriodEnd).toLocaleDateString(dateLocale);
  const historyWithoutActivePending = paymentHistory.filter(
    (row) => !(row.payment.status === "pending" && pendingPayment?.payment.id === row.payment.id),
  );

  return (
    <div className="space-y-6">
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

      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm dark:from-primary/20 dark:via-card dark:to-background">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl dark:bg-primary/20" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 dark:bg-primary/25">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              {t("billing.organizer.currentPlan", { name: displayPlanName })}
            </h2>
            {subscription.status === "past_due" && (
              <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
                {t("billing.organizer.statusPastDue")}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{billedPlan?.description ?? plan.description}</p>
          {billedPlan && subscription.status === "past_due" && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("billing.organizer.activeLimits", { name: plan.name })}
            </p>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <UsageCard label={t("billing.organizer.usageEvents")} value={`${usage.activeEvents} / ${plan.maxActiveEvents ?? "∞"}`} />
            <UsageCard label={t("billing.organizer.usageBroadcasts")} value={`${usage.broadcastsThisMonth} / ${plan.maxBroadcastsPerMonth ?? "∞"}`} />
            <UsageCard label={t("billing.organizer.usageCommission")} value={`${plan.commissionPercent}%`} />
            <UsageCard label={t("billing.organizer.usageRenewal")} value={renewalDate} />
          </div>
        </div>
      </div>

      {historyWithoutActivePending.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">{t("billing.organizer.paymentHistory")}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">{t("billing.organizer.colDate")}</th>
                  <th className="pb-2 pr-4 font-medium">{t("billing.organizer.colPlan")}</th>
                  <th className="pb-2 pr-4 font-medium">{t("billing.organizer.colAmount")}</th>
                  <th className="pb-2 pr-4 font-medium">{t("billing.organizer.colMethod")}</th>
                  <th className="pb-2 font-medium">{t("billing.organizer.colStatus")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {historyWithoutActivePending.map(({ payment, plan: paymentPlan }) => (
                  <tr key={payment.id}>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleDateString(dateLocale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 pr-4 font-medium text-foreground">{paymentPlan.name}</td>
                    <td className="py-3 pr-4 text-foreground">
                      S/ {Number(payment.amount).toFixed(2)}
                    </td>
                    <td className="py-3 pr-4 capitalize text-muted-foreground">{payment.method}</td>
                    <td className="py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                          PAYMENT_STATUS_STYLES[payment.status] ?? PAYMENT_STATUS_STYLES.pending,
                        )}
                      >
                        {PAYMENT_STATUS_KEYS[payment.status]
                          ? t(PAYMENT_STATUS_KEYS[payment.status])
                          : payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>{t("billing.organizer.choosePlan")}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {availablePlans.map((p) => {
          const isCurrent = subscription.status === "active" && p.slug === plan.slug;
          const isBilledCurrent = billedPlan?.slug === p.slug;
          const isPro = p.slug === "pro";
          const isPaid = Number(p.priceMonthly) > 0;
          return (
            <div
              key={p.id}
              className={cn(
                "flex flex-col rounded-2xl border p-5 shadow-sm transition",
                isCurrent || isBilledCurrent
                  ? "border-primary bg-primary/5 ring-2 ring-primary/25 dark:bg-primary/10"
                  : "border-border bg-card hover:border-primary/30 hover:shadow-md",
                isPro && !isCurrent && !isBilledCurrent && "border-primary/20 dark:border-primary/30",
              )}
            >
              {isPro && (
                <span className="mb-2 w-fit rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary dark:bg-primary/25">
                  {t("billing.organizer.recommended")}
                </span>
              )}
              <h3 className="text-lg font-semibold text-foreground">{p.name}</h3>
              <p className="mt-1 text-2xl font-bold text-foreground">
                S/ {p.priceMonthly}
                <span className="text-sm font-normal text-muted-foreground">{t("billing.organizer.perMonth")}</span>
              </p>
              <p className="mt-2 min-h-[2.5rem] text-sm text-muted-foreground">{p.description}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                <FeatureLine ok={p.featureCulqi} text={t("billing.organizer.featureCulqi")} />
                <FeatureLine ok={p.featureTransport} text={t("billing.organizer.featureTransport")} />
                <FeatureLine ok={p.featureAi} text={t("billing.organizer.featureAi")} />
                <FeatureLine ok={p.featureExports} text={t("billing.organizer.featureExports")} />
              </ul>
              <button
                type="button"
                disabled={isCurrent || isPending || !!pendingPayment}
                onClick={() => onSelectPlan(p)}
                className={cn(
                  "mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
                  isCurrent
                    ? "border border-border bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                {isPending ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : isCurrent ? (
                  t("billing.organizer.currentPlanBtn")
                ) : isBilledCurrent && subscription.status === "past_due" ? (
                  t("billing.organizer.renewPlanBtn")
                ) : isPaid ? (
                  t("billing.organizer.payAndActivateBtn")
                ) : (
                  t("billing.organizer.activateFreeBtn")
                )}
              </button>
            </div>
          );
        })}
      </div>

      {planChangeConfirm && (
        <PlanChangeConfirmDialog
          targetPlan={planChangeConfirm.target}
          preview={planChangeConfirm.preview}
          isPending={isPending}
          onCancel={() => setPlanChangeConfirm(null)}
          onConfirm={() => proceedPlanChange(planChangeConfirm.target, true)}
        />
      )}

      {checkoutPlan && (
        <PlanUpgradeCheckout
          plan={checkoutPlan.plan}
          newPeriodEnd={checkoutPlan.newPeriodEnd}
          platformMethods={platformMethods}
          culqiPublicKey={culqiPublicKey}
          userEmail={userEmail}
          onClose={() => setCheckoutPlan(null)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}

function UsageCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/70 p-3 backdrop-blur-sm dark:bg-background/40">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function FeatureLine({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li
      className={cn(
        "flex items-center gap-2",
        ok ? "text-foreground" : "text-muted-foreground line-through decoration-muted-foreground/50",
      )}
    >
      <Check
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/40",
        )}
      />
      {text}
    </li>
  );
}
