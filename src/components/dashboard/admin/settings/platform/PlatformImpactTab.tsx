"use client";

import { useState, useTransition } from "react";
import { Save, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/components/providers/LocaleProvider";
import { saveSystemSettingsAction } from "@/actions/admin/settings";
import { useRouter } from "next/navigation";
import type { SystemSettings } from "@/lib/settings";
import { ImpactMetricsHeader, ImpactCardEditor } from "./impact";

export interface PlatformImpactTabProps {
  initialPlatformSettings: SystemSettings;
}

export function PlatformImpactTab({ initialPlatformSettings }: PlatformImpactTabProps) {
  const { locale } = useLocale();
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();

  const [impactCard1Title, setImpactCard1Title] = useState(
    initialPlatformSettings.impactCard1Title ?? "5+ años impulsando"
  );
  const [impactCard1Subtitle, setImpactCard1Subtitle] = useState(
    initialPlatformSettings.impactCard1Subtitle ?? "Eventos de tecnología, negocios e innovación en Huánuco y todo el Perú."
  );
  const [impactCard1ImageUrl, setImpactCard1ImageUrl] = useState(
    initialPlatformSettings.impactCard1ImageUrl ?? ""
  );

  const [impactCard2Title, setImpactCard2Title] = useState(
    initialPlatformSettings.impactCard2Title ?? "Más de 250 empresas"
  );
  const [impactCard2Subtitle, setImpactCard2Subtitle] = useState(
    initialPlatformSettings.impactCard2Subtitle ?? "Ya patrocinan y reclutan talento activamente en nuestros eventos."
  );
  const [impactCard2ImageUrl, setImpactCard2ImageUrl] = useState(
    initialPlatformSettings.impactCard2ImageUrl ?? ""
  );

  const [impactSatisfactionRate, setImpactSatisfactionRate] = useState(
    initialPlatformSettings.impactSatisfactionRate ?? "99.8%"
  );

  const handleSaveImpactMetrics = () => {
    if (!impactCard1Title.trim() || !impactCard2Title.trim()) {
      toast.error(
        locale === "en"
          ? "Card titles cannot be empty"
          : "Los títulos de las tarjetas no pueden estar vacíos"
      );
      return;
    }

    startSaving(async () => {
      try {
        const res = await saveSystemSettingsAction({
          impactCard1Title: impactCard1Title.trim(),
          impactCard1Subtitle: impactCard1Subtitle.trim(),
          impactCard1ImageUrl: impactCard1ImageUrl.trim(),
          impactCard2Title: impactCard2Title.trim(),
          impactCard2Subtitle: impactCard2Subtitle.trim(),
          impactCard2ImageUrl: impactCard2ImageUrl.trim(),
          impactSatisfactionRate: impactSatisfactionRate.trim() || "99.8%",
        });
        if (res.success) {
          toast.success(
            locale === "en"
              ? "Landing impact metrics saved successfully"
              : "Métricas y tarjetas de portada guardadas con éxito"
          );
          router.refresh();
        } else {
          toast.error(locale === "en" ? "Error saving metrics" : "Error al guardar métricas");
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error";
        toast.error(message);
      }
    });
  };

  return (
    <div className="space-y-6">
      <ImpactMetricsHeader
        locale={locale}
        isSaving={isSaving}
        onSave={handleSaveImpactMetrics}
      />

      <ImpactCardEditor
        cardNumber={1}
        headerTitle={locale === "en" ? "Visual Card 1 (Left)" : "Tarjeta Visual 1 (Izquierda)"}
        headerSubtitle={
          locale === "en"
            ? "Hero banner card displayed on the left side of the impact section."
            : "Tarjeta destacada que se muestra en el lado izquierdo del bloque oscuro de impacto."
        }
        titleLabel={locale === "en" ? "Card 1 Title" : "Título de la Tarjeta 1"}
        cardTitle={impactCard1Title}
        setCardTitle={setImpactCard1Title}
        titlePlaceholder="5+ años impulsando"
        subtitleLabel={locale === "en" ? "Card 1 Subtitle / Description" : "Subtítulo / Descripción de la Tarjeta 1"}
        cardSubtitle={impactCard1Subtitle}
        setCardSubtitle={setImpactCard1Subtitle}
        subtitlePlaceholder="Eventos de tecnología, negocios e innovación en Huánuco y todo el Perú."
        cardImageUrl={impactCard1ImageUrl}
        setCardImageUrl={setImpactCard1ImageUrl}
        imageLabel={locale === "en" ? "Card 1 Background Image" : "Imagen de fondo de la Tarjeta 1"}
        imageDescription={
          locale === "en"
            ? "Select an image file from your device or drag & drop (JPG, PNG, WEBP up to 4MB)."
            : "Selecciona un archivo de imagen de tu equipo o arrástralo (JPG, PNG, WEBP hasta 4MB)."
        }
        locale={locale === "en" ? "en" : "es"}
      />

      <ImpactCardEditor
        cardNumber={2}
        headerTitle={locale === "en" ? "Visual Card 2 (Right)" : "Tarjeta Visual 2 (Derecha)"}
        headerSubtitle={
          locale === "en"
            ? "Hero banner card displayed on the right side of the impact section."
            : "Tarjeta destacada que se muestra en el lado derecho del bloque oscuro de impacto."
        }
        titleLabel={locale === "en" ? "Card 2 Title" : "Título de la Tarjeta 2"}
        cardTitle={impactCard2Title}
        setCardTitle={setImpactCard2Title}
        titlePlaceholder="Más de 250 empresas"
        subtitleLabel={locale === "en" ? "Card 2 Subtitle / Description" : "Subtítulo / Descripción de la Tarjeta 2"}
        cardSubtitle={impactCard2Subtitle}
        setCardSubtitle={setImpactCard2Subtitle}
        subtitlePlaceholder="Ya patrocinan y reclutan talento activamente en nuestros eventos."
        cardImageUrl={impactCard2ImageUrl}
        setCardImageUrl={setImpactCard2ImageUrl}
        imageLabel={locale === "en" ? "Card 2 Background Image" : "Imagen de fondo de la Tarjeta 2"}
        imageDescription={
          locale === "en"
            ? "Select an image file from your device or drag & drop (JPG, PNG, WEBP up to 4MB)."
            : "Selecciona un archivo de imagen de tu equipo o arrástralo (JPG, PNG, WEBP hasta 4MB)."
        }
        locale={locale === "en" ? "en" : "es"}
      />

      {/* Métrica de Satisfacción */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            {locale === "en" ? "Satisfaction Rate" : "Porcentaje de Satisfacción de Organizadores"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "en"
              ? "Displayed in the 4-stat counter bar below the impact visual cards."
              : "Se muestra en la barra de 4 estadísticas debajo de las dos tarjetas visuales (ej. 99.8% o 99.9%)."}
          </p>
        </div>

        <div className="max-w-xs space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            {locale === "en" ? "Satisfaction percentage" : "Tasa de satisfacción"}
          </label>
          <input
            type="text"
            value={impactSatisfactionRate}
            onChange={(e) => setImpactSatisfactionRate(e.target.value)}
            placeholder="99.8%"
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
        </div>

        <div className="flex justify-end pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={handleSaveImpactMetrics}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {locale === "en" ? "Save impact metrics" : "Guardar métricas de portada"}
          </button>
        </div>
      </div>
    </div>
  );
}
