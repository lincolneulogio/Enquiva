"use client";

import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { SubscriptionInfo } from "@/lib/billing/types";

interface CurrentPlanCardProps {
  subscription: SubscriptionInfo;
  displayPlanName: string;
  renewalDate: string;
}

export function CurrentPlanCard({
  subscription,
  displayPlanName,
  renewalDate,
}: CurrentPlanCardProps) {
  const t = useTranslations();
  const { plan, usage, billedPlan, daysUntilRenewal } = subscription;

  const isPaidPlan =
    Boolean(billedPlan && billedPlan.priceMonthly > 0) ||
    (subscription.status === "active" && plan.slug !== "free" && plan.priceMonthly > 0);

  return (
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
            isPaidPlan={isPaidPlan}
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <UsageCard
            label={t("billing.organizer.usageEvents")}
            value={`${usage.activeEvents} / ${plan.maxActiveEvents ?? "∞"}`}
          />
          <UsageCard
            label={t("billing.organizer.usageBroadcasts")}
            value={`${usage.broadcastsThisMonth} / ${plan.maxBroadcastsPerMonth ?? "∞"}`}
          />
          {plan.features.ai || (plan.maxAiMessagesPerMonth != null && plan.maxAiMessagesPerMonth > 0) ? (
            <UsageCard
              label={t("billing.organizer.usageAiMessages")}
              value={
                plan.maxAiMessagesPerMonth != null
                  ? `${usage.aiMessagesThisMonth} / ${plan.maxAiMessagesPerMonth}`
                  : `${usage.aiMessagesThisMonth} / ∞`
              }
            />
          ) : null}
          <UsageCard
            label={t("billing.organizer.usageAttendeesPerEvent")}
            value={plan.maxAttendeesPerEvent != null ? String(plan.maxAttendeesPerEvent) : "∞"}
          />
          <UsageCard label={t("billing.organizer.usageRenewal")} value={renewalDate} />
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          {t("billing.organizer.quotaPolicyNote")}
        </p>
      </div>
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
