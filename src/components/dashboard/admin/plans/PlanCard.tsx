import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/db/schema";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { isPlatformSpecialPlan, isRecommendedBillingPlan } from "@/lib/billing/plans";
import { featureBadgeClass } from "./types";

interface PlanCardProps {
  plan: Plan;
  allPlans: Plan[];
  onEdit: (plan: Plan) => void;
  onDelete: (id: string) => void;
}

export function PlanCard({ plan, allPlans, onEdit, onDelete }: PlanCardProps) {
  const t = useTranslations();
  const isSpecial = isPlatformSpecialPlan(plan);
  const isRecommended =
    !isSpecial && isRecommendedBillingPlan(plan, allPlans.filter((p) => !isPlatformSpecialPlan(p)));

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-sm transition hover:border-border/80",
        isSpecial
          ? "border-amber-500/40 ring-1 ring-amber-500/20"
          : isRecommended
            ? "border-primary/40 ring-1 ring-primary/20"
            : "border-border",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {plan.slug}
            </span>
            {isSpecial && (
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                Solo superadmin · oculto al catálogo
              </span>
            )}
            {isRecommended && (
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary dark:bg-primary/25">
                {t("dashboard.admin.plansRecommendedBadge")}
              </span>
            )}
            {!plan.isActive && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                {t("dashboard.admin.plansInactive")}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
          <p className="mt-2 text-sm font-medium text-foreground">
            {Number(plan.commissionPercent) > 0 || Number(plan.commissionPerRegistration) > 0
              ? t("dashboard.admin.plansPriceLineWithCommission", {
                  price: String(plan.priceMonthly),
                  commission: String(plan.commissionPercent),
                })
              : t("dashboard.admin.plansPriceLineNoCommission", {
                  price: String(plan.priceMonthly),
                })}
            {Number(plan.commissionPerRegistration) > 0 ? (
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                + S/ {Number(plan.commissionPerRegistration).toFixed(2)} por inscrito
              </span>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("dashboard.admin.plansLimitsLine", {
              events: plan.maxActiveEvents ?? "∞",
              attendees: plan.maxAttendeesPerEvent ?? "∞",
              broadcasts: plan.maxBroadcastsPerMonth ?? "∞",
              ai: plan.maxAiMessagesPerMonth ?? "∞",
            })}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {plan.featureCulqi && (
              <span className={cn("rounded-md px-2 py-0.5 font-medium", featureBadgeClass.culqi)}>
                Culqi
              </span>
            )}
            {plan.featureTransport && (
              <span className={cn("rounded-md px-2 py-0.5 font-medium", featureBadgeClass.transport)}>
                {t("dashboard.admin.plansFeatureTransport")}
              </span>
            )}
            {plan.featureAi && (
              <span className={cn("rounded-md px-2 py-0.5 font-medium", featureBadgeClass.ai)}>IA</span>
            )}
            {plan.featureExports && (
              <span className={cn("rounded-md px-2 py-0.5 font-medium", featureBadgeClass.exports)}>
                {t("dashboard.admin.plansFeatureExports")}
              </span>
            )}
            {plan.featureCustomBranding && (
              <span className={cn("rounded-md px-2 py-0.5 font-medium", featureBadgeClass.branding)}>
                {t("dashboard.admin.plansFeatureBranding")}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(plan)}
            className="rounded-lg border border-border bg-background p-2 text-foreground transition hover:bg-muted"
            aria-label={t("dashboard.admin.plansEditAria")}
          >
            <Pencil className="h-4 w-4" />
          </button>
          {!isSpecial && (
            <button
              type="button"
              onClick={() => onDelete(plan.id)}
              className="rounded-lg border border-border bg-background p-2 text-destructive transition hover:bg-destructive/10"
              aria-label={t("dashboard.admin.plansDeleteAria")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
