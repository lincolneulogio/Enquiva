"use client";

interface SpotlightCustomFieldsProps {
  locale: "es" | "en";
  eventBannerEnabled: boolean;
  eventBannerCustomBadge: string;
  setEventBannerCustomBadge: (val: string) => void;
  eventBannerCustomText: string;
  setEventBannerCustomText: (val: string) => void;
}

export function SpotlightCustomFields({
  locale,
  eventBannerEnabled,
  eventBannerCustomBadge,
  setEventBannerCustomBadge,
  eventBannerCustomText,
  setEventBannerCustomText,
}: SpotlightCustomFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          {locale === "en" ? "Custom Badge (Optional)" : "Insignia / Badge personalizado (Opcional)"}
        </label>
        <input
          type="text"
          value={eventBannerCustomBadge}
          onChange={(e) => setEventBannerCustomBadge(e.target.value)}
          disabled={!eventBannerEnabled}
          maxLength={40}
          placeholder={locale === "en" ? "e.g. ⭐ Featured Event" : "ej. ⭐ Evento Recomendado"}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
        />
        <p className="text-[11px] text-muted-foreground">
          {locale === "en"
            ? "Leave blank to use the automatic badge (e.g. 🔥 Most Popular)."
            : "Vacío = usa el badge dinámico del sistema (ej. 🔥 Más Popular)."}
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          {locale === "en"
            ? "Custom Highlight Text (Optional)"
            : "Mensaje de urgencia personalizado (Opcional)"}
        </label>
        <input
          type="text"
          value={eventBannerCustomText}
          onChange={(e) => setEventBannerCustomText(e.target.value)}
          disabled={!eventBannerEnabled}
          maxLength={100}
          placeholder={
            locale === "en"
              ? "e.g. Last 5 tickets with 20% OFF"
              : "ej. ¡Últimas 10 entradas disponibles!"
          }
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
        />
        <p className="text-[11px] text-muted-foreground">
          {locale === "en"
            ? "Leave blank to display the automatically calculated spots/date."
            : "Vacío = muestra los cupos restantes o fecha calculada automáticamente."}
        </p>
      </div>
    </div>
  );
}
