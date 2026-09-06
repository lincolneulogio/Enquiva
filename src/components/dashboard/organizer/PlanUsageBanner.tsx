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
        "rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5",
        !summary.canCreateEvent && "border-amber-300/60 dark:border-amber-800/40",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Crown className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              Plan {plan.name}
              {!summary.canCreateEvent && (
                <span className="ml-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                  {t("dashboard.organizer.planUsageLimitReached")}
                </span>
              )}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("dashboard.organizer.planUsageActiveEvents")}{" "}
              <strong className="text-foreground">{eventsLabel}</strong>
              {" · "}
              {t("dashboard.organizer.planUsageBroadcasts")}{" "}
              <strong className="text-foreground">{broadcastsLabel}</strong>
              {aiMessagesLabel && (
                <>
                  {" · "}
                  {t("dashboard.organizer.planUsageAiMessages")}{" "}
                  <strong className="text-foreground">{aiMessagesLabel}</strong>
                </>
              )}
              {plan.maxAttendeesPerEvent != null && (
                <>
                  {" · "}
                  {t("dashboard.organizer.planUsageMaxAttendees")}{" "}
                  <strong className="text-foreground">{plan.maxAttendeesPerEvent}</strong>
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
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/95 hover:shadow hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            {t("dashboard.organizer.planUsageUpgrade")} &rarr;
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
