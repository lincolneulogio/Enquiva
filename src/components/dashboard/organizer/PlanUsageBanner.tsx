import Link from "next/link";
import { Crown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { getOrganizerPlanSummary } from "@/lib/billing/enforce";

type PlanSummary = Awaited<ReturnType<typeof getOrganizerPlanSummary>>;

interface PlanUsageBannerProps {
  summary: PlanSummary;
  className?: string;
  showFeatures?: boolean;
}

export function PlanUsageBanner({ summary, className, showFeatures = false }: PlanUsageBannerProps) {
  if (summary.isUnlimited) return null;

  const { plan, usage } = summary;
  const eventsLabel =
    plan.maxActiveEvents != null
      ? `${usage.activeEvents} / ${plan.maxActiveEvents}`
      : `${usage.activeEvents} / ∞`;
  const broadcastsLabel =
    plan.maxBroadcastsPerMonth != null
      ? `${usage.broadcastsThisMonth} / ${plan.maxBroadcastsPerMonth}`
      : `${usage.broadcastsThisMonth} / ∞`;

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
                  · Límite alcanzado
                </span>
              )}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Eventos activos (borrador/publicado): <strong className="text-foreground">{eventsLabel}</strong>
              {" · "}
              Broadcasts este mes: <strong className="text-foreground">{broadcastsLabel}</strong>
              {plan.maxAttendeesPerEvent != null && (
                <>
                  {" · "}
                  Máx. asistentes/evento: <strong className="text-foreground">{plan.maxAttendeesPerEvent}</strong>
                </>
              )}
            </p>
            {showFeatures && (
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                <FeaturePill ok={plan.features.transport} label="Transporte" />
                <FeaturePill ok={plan.features.culqi} label="Culqi" />
                <FeaturePill ok={plan.features.ai} label="IA" />
                <FeaturePill ok={plan.features.exports} label="Exportar" />
              </div>
            )}
          </div>
        </div>
        <Link
          href="/organizer/billing"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Mejorar plan
        </Link>
      </div>
    </div>
  );
}

function FeaturePill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
        ok
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-muted text-muted-foreground",
      )}
    >
      {!ok && <Lock className="h-3 w-3" />}
      {label}
    </span>
  );
}
