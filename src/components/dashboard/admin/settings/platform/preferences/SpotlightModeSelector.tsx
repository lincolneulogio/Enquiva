"use client";

import { Zap, Star, Flame } from "lucide-react";

interface SpotlightModeSelectorProps {
  locale: "es" | "en";
  eventBannerEnabled: boolean;
  eventBannerMode: "auto" | "pinned";
  setEventBannerMode: (val: "auto" | "pinned") => void;
  eventBannerCriteria: "auto" | "few_tickets" | "popular" | "upcoming";
  setEventBannerCriteria: (val: "auto" | "few_tickets" | "popular" | "upcoming") => void;
  eventBannerPinnedEventId: string;
  setEventBannerPinnedEventId: (val: string) => void;
  adminPublishedEvents: Array<{ id: string; title: string; slug?: string; date?: string }>;
}

export function SpotlightModeSelector({
  locale,
  eventBannerEnabled,
  eventBannerMode,
  setEventBannerMode,
  eventBannerCriteria,
  setEventBannerCriteria,
  eventBannerPinnedEventId,
  setEventBannerPinnedEventId,
  adminPublishedEvents,
}: SpotlightModeSelectorProps) {
  return (
    <>
      {/* Selection Mode */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">
          {locale === "en" ? "Selection Mode" : "Modo de Selección"}
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={!eventBannerEnabled}
            onClick={() => setEventBannerMode("auto")}
            className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition disabled:opacity-50 ${
              eventBannerMode === "auto"
                ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                : "border-border bg-background hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground">
                {locale === "en" ? "Smart Automatic" : "Automático Inteligente"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {locale === "en"
                ? "The system automatically selects the best event based on live demand and dates."
                : "El servidor detecta el mejor evento según demanda, fechas y cupos."}
            </p>
          </button>

          <button
            type="button"
            disabled={!eventBannerEnabled}
            onClick={() => setEventBannerMode("pinned")}
            className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition disabled:opacity-50 ${
              eventBannerMode === "pinned"
                ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                : "border-border bg-background hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-bold text-foreground">
                {locale === "en" ? "Pin Specific Event" : "Fijar Evento Específico (Manual)"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {locale === "en"
                ? "Choose an exact event to promote (e.g. sponsored or main featured event)."
                : "Tú eliges exactamente qué evento promocionar (ideal para patrocinados)."}
            </p>
          </button>
        </div>
      </div>

      {/* Auto criteria */}
      {eventBannerMode === "auto" && (
        <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            {locale === "en" ? "Preferred dynamic criterion" : "Criterio de prioridad dinámica"}
          </label>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                { id: "auto", labelEs: "Balanceado (Auto)", labelEn: "Balanced (Auto)", descEs: "Cupos > Próximo > Popular" },
                { id: "few_tickets", labelEs: "⚡ Últimos Cupos", labelEn: "⚡ Few Tickets", descEs: "Eventos con <15 cupos o 80% lleno" },
                { id: "popular", labelEs: "🔥 Más Popular", labelEn: "🔥 Most Popular", descEs: "Mayor interacción y registros" },
                { id: "upcoming", labelEs: "⏳ Próximo a Iniciar", labelEn: "⏳ Starting Soon", descEs: "Comienza en menos de 72h" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={!eventBannerEnabled}
                onClick={() => setEventBannerCriteria(item.id)}
                className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition disabled:opacity-50 ${
                  eventBannerCriteria === item.id
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                    : "border-border bg-background text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="text-xs font-semibold">
                  {locale === "en" ? item.labelEn : item.labelEs}
                </span>
                <span className="text-[10px] text-muted-foreground font-normal mt-0.5">
                  {item.descEs}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pinned event options */}
      {eventBannerMode === "pinned" && (
        <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {locale === "en" ? "Select published event" : "Selecciona el evento publicado"}
            </label>
            <select
              value={eventBannerPinnedEventId}
              onChange={(e) => setEventBannerPinnedEventId(e.target.value)}
              disabled={!eventBannerEnabled}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
            >
              <option value="">
                {locale === "en" ? "— Select an event —" : "— Selecciona un evento —"}
              </option>
              {adminPublishedEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} {ev.date ? `(${new Date(ev.date).toLocaleDateString(locale === "en" ? "en-US" : "es-PE")})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </>
  );
}
