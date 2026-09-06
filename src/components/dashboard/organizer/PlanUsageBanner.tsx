"use client";

import Link from "next/link";
import { Crown, Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { getOrganizerPlanSummary } from "@/lib/billing/enforce";
import { useTranslations } from "@/components/providers/LocaleProvider";

type PlanSummary = Awaited<ReturnType<typeof getOrganizerPlanSummary>>;

interface PlanUsageBannerProps {
  summary: PlanSummary;
  className?: string;
  showFeatures?: boolean;
}

export function PlanUsageBanner({ summary, className, showFeatures = false }: PlanUsageBannerProps) {
  const t = useTranslations();

  if (summary.isUnlimited) return null;
  if (summary.plansConfigured === false) return null;

  const { plan, usage } = summary;
  const eventsLabel =
    plan.maxActiveEvents != null
      ? `${usage.activeEvents} / ${plan.maxActiveEvents}`
      : `${usage.activeEvents} / ∞`;
  const broadcastsLabel =
    plan.maxBroadcastsPerMonth != null
      ? `${usage.broadcastsThisMonth} / ${plan.maxBroadcastsPerMonth}`
      : `${usage.broadcastsThisMonth} / ∞`;
  const aiMessagesLabel =
    plan.features.ai && plan.maxAiMessagesPerMonth != null
      ? `${usage.aiMessagesThisMonth} / ${plan.maxAiMessagesPerMonth}`
      : null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card to-primary/[0.02] p-4.5 sm:p-5 shadow-xs transition-all",
        !summary.canCreateEvent && "border-amber-400/50 bg-amber-500/[0.02]",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary border border-primary/20 shadow-2xs">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-foreground text-sm sm:text-base">
                Plan {plan.name}
              </p>
              {!summary.canCreateEvent && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {t("dashboard.organizer.planUsageLimitReached")}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {t("dashboard.organizer.planUsageActiveEvents")}:{" "}
              <strong className="text-foreground font-semibold">{eventsLabel}</strong>
              <span className="mx-1.5 text-border">•</span>
              {t("dashboard.organizer.planUsageBroadcasts")}:{" "}
              <strong className="text-foreground font-semibold">{broadcastsLabel}</strong>
              {aiMessagesLabel && (
                <>
                  <span className="mx-1.5 text-border">•</span>
                  {t("dashboard.organizer.planUsageAiMessages")}:{" "}
                  <strong className="text-foreground font-semibold">{aiMessagesLabel}</strong>
                </>
              )}
              {plan.maxAttendeesPerEvent != null && (
                <>
                  <span className="mx-1.5 text-border">•</span>
                  {t("dashboard.organizer.planUsageMaxAttendees")}:{" "}
                  <strong className="text-foreground font-semibold">{plan.maxAttendeesPerEvent}</strong>
                </>
              )}
            </p>
            {showFeatures && (
              <div className="mt-2.5 flex flex-wrap gap-2 text-[11px]">
                <FeaturePill ok={plan.features.transport} label={t("dashboard.organizer.planUsageFeatureTransport")} />
                <FeaturePill ok={plan.features.culqi} label={t("dashboard.organizer.planUsageFeatureCulqi")} />
                <FeaturePill ok={plan.features.ai} label={t("dashboard.organizer.planUsageFeatureAi")} />
                <FeaturePill ok={plan.features.exports} label={t("dashboard.organizer.planUsageFeatureExports")} />
              </div>
            )}
          </div>
        </div>
        {summary.canManageBilling ? (
          <Link
            href="/organizer/billing"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:bg-primary/95 hover:shadow-md hover:shadow-primary/30 active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <span>{t("dashboard.organizer.planUsageUpgrade")}</span>
            <span>&rarr;</span>
          </Link>
        ) : summary.organizationName ? (
          <p className="max-w-xs text-right text-xs text-muted-foreground">
            {t("dashboard.organizer.planUsageManagedByAdmin", { org: summary.organizationName })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function FeaturePill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium border transition-colors",
        ok
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
          : "bg-muted/60 text-muted-foreground border-border/80",
      )}
    >
      {ok ? <Check className="h-3 w-3 text-emerald-600" /> : <Lock className="h-3 w-3 text-muted-foreground" />}
      {label}
    </span>
  );
}
