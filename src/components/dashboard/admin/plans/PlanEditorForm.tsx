import { Crown, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { cardClass, inputClass, type PlanFormData } from "./types";
import { planSlugFromName } from "./utils";
import { PlanLimitsFields } from "./PlanLimitsFields";
import { PlanFeaturesFields } from "./PlanFeaturesFields";

interface PlanEditorFormProps {
  editingId: string | null;
  editingSpecial: boolean;
  slugLocked: boolean;
  liveSlug: string;
  form: PlanFormData;
  isPending: boolean;
  onFormChange: (form: PlanFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function PlanEditorForm({
  editingId,
  editingSpecial,
  slugLocked,
  liveSlug,
  form,
  isPending,
  onFormChange,
  onSubmit,
  onCancel,
}: PlanEditorFormProps) {
  const t = useTranslations();

  return (
    <div className={cardClass}>
      <h2 className="mb-4 flex items-center gap-2 border-b border-border/50 pb-3 text-lg font-semibold text-foreground">
        <Crown className="h-5 w-5 text-amber-500 dark:text-amber-400" />
        {editingId ? t("dashboard.admin.plansEditTitle") : t("dashboard.admin.plansCreateTitle")}
      </h2>
      {editingSpecial && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Plan especial del superadmin: siempre ilimitado, sin comisión y oculto del catálogo público.
          Solo puedes editar nombre y descripción.
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="plan-name" className="text-sm font-medium text-foreground">
            {t("dashboard.admin.plansLabelName")}
          </label>
          <input
            id="plan-name"
            type="text"
            autoComplete="off"
            className={inputClass}
            placeholder={t("dashboard.admin.plansPlaceholderName")}
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              onFormChange({
                ...form,
                name,
                ...(slugLocked ? {} : { slug: planSlugFromName(name) }),
              });
            }}
            autoFocus={!editingId}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="plan-slug" className="text-sm font-medium text-foreground">
            {t("dashboard.admin.plansLabelSlug")}
          </label>
          <input
            id="plan-slug"
            type="text"
            className={cn(inputClass, "bg-muted/40 font-mono text-muted-foreground")}
            placeholder={t("dashboard.admin.plansPlaceholderSlug")}
            value={liveSlug}
            readOnly
            disabled
            tabIndex={-1}
            aria-readonly="true"
          />
          <p className="text-xs text-muted-foreground">{t("dashboard.admin.plansHintSlug")}</p>
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="plan-description" className="text-sm font-medium text-foreground">
            {t("dashboard.admin.plansLabelDescription")}
          </label>
          <input
            id="plan-description"
            type="text"
            className={inputClass}
            placeholder={t("dashboard.admin.plansPlaceholderDescription")}
            value={form.description}
            onChange={(e) => onFormChange({ ...form, description: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="plan-price" className="text-sm font-medium text-foreground">
            {t("dashboard.admin.plansLabelPrice")}
          </label>
          <input
            id="plan-price"
            type="number"
            min={0}
            step="0.01"
            className={inputClass}
            placeholder={t("dashboard.admin.plansPlaceholderPrice")}
            value={form.priceMonthly}
            onChange={(e) => onFormChange({ ...form, priceMonthly: e.target.value })}
            disabled={editingSpecial}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="plan-commission" className="text-sm font-medium text-foreground">
            {t("dashboard.admin.plansLabelCommission")}
          </label>
          <input
            id="plan-commission"
            type="number"
            min={0}
            step="0.01"
            className={inputClass}
            placeholder={t("dashboard.admin.plansPlaceholderCommission")}
            value={form.commissionPercent}
            onChange={(e) => onFormChange({ ...form, commissionPercent: e.target.value })}
            disabled={editingSpecial}
          />
          <p className="text-xs text-muted-foreground">{t("dashboard.admin.plansHintCommission")}</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="plan-commission-fixed" className="text-sm font-medium text-foreground">
            Comisión fija por inscrito (S/)
          </label>
          <input
            id="plan-commission-fixed"
            type="number"
            min={0}
            step="0.01"
            className={inputClass}
            placeholder="0.50"
            value={form.commissionPerRegistration}
            onChange={(e) => onFormChange({ ...form, commissionPerRegistration: e.target.value })}
            disabled={editingSpecial}
          />
          <p className="text-xs text-muted-foreground">
            Enquiva gana este monto por cada inscrito (titular + invitados) al aprobar el pago, además del %.
          </p>
        </div>

        <PlanLimitsFields
          form={form}
          editingSpecial={editingSpecial}
          onFormChange={onFormChange}
        />
      </div>

      <PlanFeaturesFields
        form={form}
        editingSpecial={editingSpecial}
        onFormChange={onFormChange}
      />

      <div className="mt-5 flex flex-wrap gap-2 border-t border-border/40 pt-4">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {editingId ? t("dashboard.admin.plansSaveChanges") : t("dashboard.admin.plansCreateAction")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground transition hover:bg-muted"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
