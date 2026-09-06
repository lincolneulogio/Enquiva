import { useTranslations } from "@/components/providers/LocaleProvider";
import { inputClass, type PlanFormData } from "./types";

interface PlanLimitsFieldsProps {
  form: PlanFormData;
  editingSpecial: boolean;
  onFormChange: (form: PlanFormData) => void;
}

export function PlanLimitsFields({
  form,
  editingSpecial,
  onFormChange,
}: PlanLimitsFieldsProps) {
  const t = useTranslations();

  return (
    <>
      <div className="space-y-1.5">
        <label htmlFor="plan-max-events" className="text-sm font-medium text-foreground">
          {t("dashboard.admin.plansLabelMaxEvents")}
        </label>
        <input
          id="plan-max-events"
          type="number"
          min={0}
          className={inputClass}
          placeholder={t("dashboard.admin.plansPlaceholderMaxEvents")}
          value={form.maxActiveEvents}
          onChange={(e) => onFormChange({ ...form, maxActiveEvents: e.target.value })}
          disabled={editingSpecial}
        />
        <p className="text-xs text-muted-foreground">{t("dashboard.admin.plansHintUnlimited")}</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="plan-max-attendees" className="text-sm font-medium text-foreground">
          {t("dashboard.admin.plansLabelMaxAttendees")}
        </label>
        <input
          id="plan-max-attendees"
          type="number"
          min={0}
          className={inputClass}
          placeholder={t("dashboard.admin.plansPlaceholderMaxAttendees")}
          value={form.maxAttendeesPerEvent}
          onChange={(e) => onFormChange({ ...form, maxAttendeesPerEvent: e.target.value })}
          disabled={editingSpecial}
        />
        <p className="text-xs text-muted-foreground">{t("dashboard.admin.plansHintUnlimited")}</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="plan-max-broadcasts" className="text-sm font-medium text-foreground">
          {t("dashboard.admin.plansLabelMaxBroadcasts")}
        </label>
        <input
          id="plan-max-broadcasts"
          type="number"
          min={0}
          className={inputClass}
          placeholder={t("dashboard.admin.plansPlaceholderMaxBroadcasts")}
          value={form.maxBroadcastsPerMonth}
          onChange={(e) => onFormChange({ ...form, maxBroadcastsPerMonth: e.target.value })}
          disabled={editingSpecial}
        />
        <p className="text-xs text-muted-foreground">{t("dashboard.admin.plansHintUnlimited")}</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="plan-max-ai" className="text-sm font-medium text-foreground">
          {t("dashboard.admin.plansLabelMaxAi")}
        </label>
        <input
          id="plan-max-ai"
          type="number"
          min={0}
          className={inputClass}
          placeholder={t("dashboard.admin.plansPlaceholderMaxAi")}
          value={form.maxAiMessagesPerMonth}
          onChange={(e) => onFormChange({ ...form, maxAiMessagesPerMonth: e.target.value })}
          disabled={editingSpecial}
        />
        <p className="text-xs text-muted-foreground">{t("dashboard.admin.plansHintUnlimited")}</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="plan-max-organizers" className="text-sm font-medium text-foreground">
          {t("dashboard.admin.plansLabelMaxOrganizers")}
        </label>
        <input
          id="plan-max-organizers"
          type="number"
          min={0}
          className={inputClass}
          placeholder={t("dashboard.admin.plansPlaceholderMaxOrganizers")}
          value={form.maxOrganizers}
          onChange={(e) => onFormChange({ ...form, maxOrganizers: e.target.value })}
          disabled={editingSpecial}
        />
        <p className="text-xs text-muted-foreground">{t("dashboard.admin.plansHintUnlimited")}</p>
      </div>
    </>
  );
}
