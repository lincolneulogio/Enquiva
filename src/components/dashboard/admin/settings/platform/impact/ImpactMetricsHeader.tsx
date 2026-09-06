"use client";

import { Sparkles, Save, Loader2, Eye } from "lucide-react";

interface ImpactMetricsHeaderProps {
  locale: "es" | "en";
  isSaving: boolean;
  onSave: () => void;
}

export function ImpactMetricsHeader({
  locale,
  isSaving,
  onSave,
}: ImpactMetricsHeaderProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {locale === "en" ? "Landing impact & metrics" : "Métricas y tarjetas de impacto en portada"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
            {locale === "en"
              ? "Customize the headline cards, satisfaction score and see how the community metrics displayed on the public landing page operate."
              : "Personaliza las dos tarjetas visuales principales, el porcentaje de satisfacción y consulta cómo se calculan las métricas comunitarias públicas de la portada."}
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50 shrink-0"
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {locale === "en" ? "Save impact metrics" : "Guardar cambios"}
        </button>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4 text-xs text-foreground space-y-2">
        <div className="font-semibold text-primary flex items-center gap-1.5">
          <Eye className="h-4 w-4" />
          {locale === "en" ? "Real-time metrics vs Editorial metrics" : "Métricas en tiempo real vs Métricas editoriales"}
        </div>
        <div className="grid gap-2 sm:grid-cols-3 text-[11px] text-muted-foreground pt-1">
          <div className="rounded-md border border-border/60 bg-background/60 p-2.5">
            <span className="font-semibold text-foreground block mb-0.5">
              {locale === "en" ? "Confirmed Attendees" : "Asistentes registrados"}
            </span>
            {locale === "en"
              ? "Real-time DB query: counts only users with paid/active tickets (no pending holds)."
              : "Consulta en tiempo real: cuenta únicamente inscritos con ticket generado pagado o activo (sin reservas temporales pendientes)."}
          </div>
          <div className="rounded-md border border-border/60 bg-background/60 p-2.5">
            <span className="font-semibold text-foreground block mb-0.5">
              {locale === "en" ? "Executed Events" : "Eventos ejecutados"}
            </span>
            {locale === "en"
              ? "Real-time DB query: counts published and completed events across the platform."
              : "Consulta en tiempo real: cuenta automáticamente eventos publicados y completados de la plataforma."}
          </div>
          <div className="rounded-md border border-border/60 bg-background/60 p-2.5">
            <span className="font-semibold text-foreground block mb-0.5">
              {locale === "en" ? "Active Organizations" : "Organizaciones activas"}
            </span>
            {locale === "en"
              ? "Real-time DB query: counts verified active organizer entities."
              : "Consulta en tiempo real: cuenta entidades organizadoras activas en el sistema."}
          </div>
        </div>
      </div>
    </div>
  );
}
