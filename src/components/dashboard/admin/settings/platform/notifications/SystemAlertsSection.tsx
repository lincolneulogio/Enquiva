"use client";

import { Save, Loader2 } from "lucide-react";
import type { AlertItem } from "./notification-alert-items";
import { AlertRow } from "./AlertRow";

interface SystemAlertsSectionProps {
  locale: "es" | "en";
  alertList: AlertItem[];
  isSaving: boolean;
  onSave: () => void;
}

export function SystemAlertsSection({
  locale,
  alertList,
  isSaving,
  onSave,
}: SystemAlertsSectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {locale === "en" ? "System alert subscriptions" : "Suscripción de alertas del sistema"}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {locale === "en"
            ? "Choose which platform events notify super administrators. Each alert type uses its own color."
            : "Elige qué eventos de plataforma notifican a los superadministradores. Cada tipo tiene su color."}
        </p>
      </div>

      <div className="space-y-3">
        {alertList.map((alert) => (
          <AlertRow key={alert.key} alert={alert} locale={locale} />
        ))}
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {locale === "en" ? "Save push & alerts" : "Guardar push y alertas"}
        </button>
      </div>
    </div>
  );
}
