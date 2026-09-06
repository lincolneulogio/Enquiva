import { useTranslations } from "@/components/providers/LocaleProvider";
import { FeatureToggle } from "./FeatureToggle";
import type { PlanFormData } from "./types";

interface PlanFeaturesFieldsProps {
  form: PlanFormData;
  editingSpecial: boolean;
  onFormChange: (form: PlanFormData) => void;
}

export function PlanFeaturesFields({
  form,
  editingSpecial,
  onFormChange,
}: PlanFeaturesFieldsProps) {
  const t = useTranslations();

  return (
    <div className="mt-4 space-y-2">
      <p className="text-sm font-medium text-foreground">{t("dashboard.admin.plansLabelFeatures")}</p>
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
        <FeatureToggle
          label={t("dashboard.admin.plansFeatureCulqi")}
          checked={form.featureCulqi}
          onChange={(v) => onFormChange({ ...form, featureCulqi: v })}
          disabled={editingSpecial}
        />
        <FeatureToggle
          label={t("dashboard.admin.plansFeatureTransport")}
          checked={form.featureTransport}
          onChange={(v) => onFormChange({ ...form, featureTransport: v })}
          disabled={editingSpecial}
        />
        <FeatureToggle
          label={t("dashboard.admin.plansFeatureAi")}
          checked={form.featureAi}
          onChange={(v) => onFormChange({ ...form, featureAi: v })}
          disabled={editingSpecial}
        />
        <FeatureToggle
          label={t("dashboard.admin.plansFeatureExports")}
          checked={form.featureExports}
          onChange={(v) => onFormChange({ ...form, featureExports: v })}
          disabled={editingSpecial}
        />
        <FeatureToggle
          label={t("dashboard.admin.plansFeatureBranding")}
          checked={form.featureCustomBranding}
          onChange={(v) => onFormChange({ ...form, featureCustomBranding: v })}
          disabled={editingSpecial}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {t("dashboard.admin.plansFeatureBrandingHint")}
      </p>
    </div>
  );
}
