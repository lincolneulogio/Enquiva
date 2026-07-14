"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { requestPlanUpgrade } from "@/actions/billing";
import { Check, Crown, Loader2, Sparkles, Clock, AlertTriangle, History, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Plan, PaymentMethod, SubscriptionPayment } from "@/lib/db/schema";
import type { SubscriptionInfo } from "@/lib/billing/types";
import { PlanUpgradeCheckout } from "@/components/dashboard/organizer/PlanUpgradeCheckout";
import { PlanChangeConfirmDialog } from "@/components/dashboard/organizer/PlanChangeConfirmDialog";
import { AutoRenewSettings } from "@/components/dashboard/organizer/AutoRenewSettings";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import type { PlanChangePreview } from "@/lib/billing/types";
import {
  closeActiveCulqiCheckout,
  resetCulqiCheckoutUi,
  loadCulqiCheckoutScript,
} from "@/lib/culqi/open-checkout";
import {
  filterPublicBillingPlans,
  isRecommendedBillingPlan,
  mapPlanRow,
} from "@/lib/billing/plans";
import { getPricingFeatureLines } from "@/lib/billing/pricing-features";

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
  culqiAvailable: boolean;
  pendingPayment: PendingPayment | null;
  paymentHistory: PaymentHistoryRow[];
  readOnly?: boolean;
  pageVariant?: "organizer" | "entity";
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
  culqiAvailable,
  pendingPayment,
  paymentHistory,
  readOnly = false,
  pageVariant = "organizer",
}: OrganizerBillingClientProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [isPending, startTransition] = useTransition();
  const [checkoutPlan, setCheckoutPlan] = useState<{
    plan: Plan;
    newPeriodEnd: string | null;
  } | null>(null);
  const [planChangeConfirm, setPlanChangeConfirm] = useState<{
    target: Plan;
    preview: PlanChangePreview;
  } | null>(null);
  const [openingCheckout, setOpeningCheckout] = useState(false);
  const { plan, usage, billedPlan, renewalAlert, daysUntilRenewal } = subscription;
  const displayPlanName = billedPlan?.name ?? plan.name;
  const plansReady = subscription.plansConfigured !== false;
  const selectablePlans = filterPublicBillingPlans(availablePlans);

  // Precarga Culqi para que el primer “Pagar” no espere el script.
  useEffect(() => {
    if (!culqiPublicKey || !culqiAvailable || !plansReady) return;
    void loadCulqiCheckoutScript().catch(() => {
      /* se reintenta al pagar */
    });
  }, [culqiPublicKey, culqiAvailable, plansReady]);

  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    closeActiveCulqiCheckout();
    resetCulqiCheckoutUi();
    setCheckoutPlan(null);
    setPlanChangeConfirm(null);
  }, [pathname]);

  const refreshBillingQuietly = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const openCheckoutForPlan = (target: Plan, newPeriodEnd: string | null) => {
    closeActiveCulqiCheckout();
    resetCulqiCheckoutUi();
    setPlanChangeConfirm(null);
    setCheckoutPlan({ plan: target, newPeriodEnd });
  };

  const proceedPlanChange = (target: Plan, confirmed: boolean) => {
    const planTarget = target;
    const isConfirmed = confirmed;
    setOpeningCheckout(true);
    startTransition(async () => {
      try {
        const res = await requestPlanUpgrade(planTarget.slug, isConfirmed);
        if (res.mode === "confirm" && res.preview) {
          setPlanChangeConfirm({ target: planTarget, preview: res.preview });
          return;
        }
        if (res.mode === "assigned") {
          setPlanChangeConfirm(null);
          toast.success(t("billing.organizer.planUpdated"));
          refreshBillingQuietly();
        } else if (res.mode === "checkout") {
          openCheckoutForPlan(planTarget, res.preview?.newPeriodEnd ?? null);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("billing.organizer.planChangeFailed"));
      } finally {
        setOpeningCheckout(false);
      }
    });
  };

  const onSelectPlan = (target: Plan) => {
    if (target.slug === plan.slug && !billedPlan) return;
    if (pendingPayment) {
      toast.info(t("billing.organizer.pendingExists"));
      return;
    }
    resetCulqiCheckoutUi();
    const selectedPlan = target;
    proceedPlanChange(selectedPlan, false);
  };

  const dateLocale = locale === "en" ? "en-US" : "es-PE";
  const renewalDate = new Date(subscription.currentPeriodEnd).toLocaleDateString(dateLocale);
  const historyWithoutActivePending = paymentHistory.filter(
    (row) => !(row.payment.status === "pending" && pendingPayment?.payment.id === row.payment.id),
  );

  if (!plansReady) {
    return (
      <div className="rounded-2xl border border-sky-200/70 bg-sky-50/80 p-6 dark:border-sky-900/40 dark:bg-sky-950/25">
        <h2 className="text-lg font-semibold text-foreground">
          {t("billing.organizer.plansPendingTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {pageVariant === "entity"
            ? t("billing.organizer.plansPendingBodyAdmin")
            : t("billing.organizer.plansPendingBodyOrganizer")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
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
              <p className="mt-2 text-sm text-muted-foreground">
                {billedPlan?.description ?? plan.description}
              </p>
              {billedPlan && subscription.status === "past_due" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("billing.organizer.activeLimits", { name: plan.name })}
                </p>
              )}
            </div>

            <DaysRemainingBadge
              status={subscription.status}
              daysUntilRenewal={daysUntilRenewal}
              isPaidPlan={
                Boolean(billedPlan && billedPlan.priceMonthly > 0) ||
                (subscription.status === "active" &&
                  plan.slug !== "free" &&
                  plan.priceMonthly > 0)
              }
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <UsageCard label={t("billing.organizer.usageEvents")} value={`${usage.activeEvents} / ${plan.maxActiveEvents ?? "∞"}`} />
            <UsageCard label={t("billing.organizer.usageBroadcasts")} value={`${usage.broadcastsThisMonth} / ${plan.maxBroadcastsPerMonth ?? "∞"}`} />
            {plan.features.ai && (
              <UsageCard
                label={t("billing.organizer.usageAiMessages")}
                value={
                  plan.maxAiMessagesPerMonth != null
                    ? `${usage.aiMessagesThisMonth} / ${plan.maxAiMessagesPerMonth}`
                    : `${usage.aiMessagesThisMonth} / ∞`
                }
              />
            )}
            <UsageCard
              label={locale === "en" ? "Attendees / event" : "Asistentes / evento"}
              value={plan.maxAttendeesPerEvent != null ? String(plan.maxAttendeesPerEvent) : "∞"}
            />
            <UsageCard label={t("billing.organizer.usageRenewal")} value={renewalDate} />
          </div>
        </div>
      </div>

      {!readOnly && <AutoRenewSettings subscription={subscription} culqiAvailable={culqiAvailable} />}

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

      {!readOnly && (
        <>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>{t("billing.organizer.choosePlan")}</span>
      </div>

      <div className="grid gap-4 pt-2 md:grid-cols-3">
        {selectablePlans.map((p) => {
          const isCurrent = subscription.status === "active" && p.slug === plan.slug;
          const isBilledCurrent = billedPlan?.slug === p.slug;
          const isRecommended = isRecommendedBillingPlan(p, selectablePlans);
          const isPaid = Number(p.priceMonthly) > 0;
          return (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-2xl border p-5 shadow-sm transition",
                isCurrent || isBilledCurrent
                  ? "border-primary bg-primary/5 ring-2 ring-primary/25 dark:bg-primary/10"
                  : "border-border bg-card hover:border-primary/30 hover:shadow-md",
                isRecommended && !isCurrent && !isBilledCurrent && "border-primary/40 ring-1 ring-primary/20",
              )}
            >
              {isRecommended && (
                <span className="absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm">
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
                {getPricingFeatureLines(mapPlanRow(p), locale === "en" ? "en" : "es", {
                  includeCommission: false,
                }).map((feature) => (
                  <FeatureLine key={feature.key} ok={feature.included} text={feature.text} />
                ))}
              </ul>
              <button
                type="button"
                disabled={isCurrent || isPending || openingCheckout || !!pendingPayment}
                onClick={() => onSelectPlan(p)}
                className={cn(
                  "mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
                  isCurrent
                    ? "border border-border bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                {isPending || openingCheckout ? (
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
          onClose={() => {
            closeActiveCulqiCheckout();
            resetCulqiCheckoutUi();
            setCheckoutPlan(null);
          }}
          onSuccess={() => {
            closeActiveCulqiCheckout();
            resetCulqiCheckoutUi();
            setCheckoutPlan(null);
            refreshBillingQuietly();
          }}
        />
      )}
        </>
      )}
    </div>
  );
}

function DaysRemainingBadge({
  status,
  daysUntilRenewal,
  isPaidPlan,
}: {
  status: string;
  daysUntilRenewal?: number | null;
  isPaidPlan: boolean;
}) {
  const t = useTranslations();

  if (!isPaidPlan) return null;

  if (status === "past_due") {
    return (
      <div className="shrink-0 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-center">
        <p className="text-2xl font-bold leading-none text-rose-700 dark:text-rose-400">0</p>
        <p className="mt-1 text-xs font-medium text-rose-700/80 dark:text-rose-400/80">
          {t("billing.organizer.daysRemainingLabel")}
        </p>
        <p className="mt-0.5 text-[10px] text-rose-600 dark:text-rose-400">
          {t("billing.organizer.daysExpired")}
        </p>
      </div>
    );
  }

  if (daysUntilRenewal == null || daysUntilRenewal < 0) return null;

  const urgent = daysUntilRenewal <= 7;

  return (
    <div
      className={cn(
        "shrink-0 rounded-2xl border px-5 py-3 text-center",
        urgent
          ? "border-amber-500/30 bg-amber-500/10"
          : "border-primary/25 bg-primary/10",
      )}
    >
      <p
        className={cn(
          "text-3xl font-bold leading-none",
          urgent ? "text-amber-700 dark:text-amber-400" : "text-primary",
        )}
      >
        {daysUntilRenewal}
      </p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">
        {daysUntilRenewal === 1
          ? t("billing.organizer.dayRemaining")
          : t("billing.organizer.daysRemainingLabel")}
      </p>
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
        "flex items-start gap-2",
        ok ? "text-foreground" : "text-muted-foreground/70 line-through decoration-muted-foreground/40",
      )}
    >
      {ok ? (
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
      )}
      {text}
    </li>
  );
}
