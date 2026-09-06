import { Crown, Plus } from "lucide-react";
import type { Plan } from "@/lib/db/schema";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { PlanCard } from "./PlanCard";

interface PlansListProps {
  plans: Plan[];
  onOpenCreate: () => void;
  onEdit: (plan: Plan) => void;
  onDelete: (id: string) => void;
}

export function PlansList({
  plans,
  onOpenCreate,
  onEdit,
  onDelete,
}: PlansListProps) {
  const t = useTranslations();

  if (plans.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
        <Crown className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">{t("dashboard.admin.plansEmptyList")}</p>
        <button
          type="button"
          onClick={onOpenCreate}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          {t("dashboard.admin.plansNewPlan")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          allPlans={plans}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
