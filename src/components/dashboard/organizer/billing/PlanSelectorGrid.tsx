"use client";

import { Check, X, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { isRecommendedBillingPlan, mapPlanRow } from "@/lib/billing/plans";
import { getPricingFeatureLines } from "@/lib/billing/pricing-features";
import type { Plan } from "@/lib/db/schema";
import type { SubscriptionInfo } from "@/lib/billing/types";
import type { PendingPayment } from "./types";

interface PlanSelectorGridProps {
  selectablePlans: Plan[];
  subscription: SubscriptionInfo;
  isPending: boolean;
  openingCheckout: boolean;
  pendingPayment: PendingPayment | null;
  onSelectPlan: (plan: Plan) => void;
}

export function PlanSelectorGrid({
  selectablePlans,
  subscription,
  isPending,
  openingCheckout,
  pendingPayment,
  onSelectPlan,
}: PlanSelectorGridProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const { plan, billedPlan } = subscription;

  return (
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
    </>
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
