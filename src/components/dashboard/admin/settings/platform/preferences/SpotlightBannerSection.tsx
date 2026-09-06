"use client";

import { Sparkles, Eye, Loader2, Save } from "lucide-react";
import { EventSpotlightBanner } from "@/components/shared/EventSpotlightBanner";
import type { EventSpotlightData } from "@/services/events/event-spotlight.service";
import { SpotlightModeSelector } from "./SpotlightModeSelector";
import { SpotlightCustomFields } from "./SpotlightCustomFields";

interface SpotlightBannerSectionProps {
  locale: "es" | "en";
  eventBannerEnabled: boolean;
  setEventBannerEnabled: (val: boolean) => void;
  eventBannerMode: "auto" | "pinned";
  setEventBannerMode: (val: "auto" | "pinned") => void;
  eventBannerCriteria: "auto" | "few_tickets" | "popular" | "upcoming";
  setEventBannerCriteria: (val: "auto" | "few_tickets" | "popular" | "upcoming") => void;
  eventBannerPinnedEventId: string;
  setEventBannerPinnedEventId: (val: string) => void;
  eventBannerCustomBadge: string;
  setEventBannerCustomBadge: (val: string) => void;
  eventBannerCustomText: string;
  setEventBannerCustomText: (val: string) => void;
  spotlightPreview: EventSpotlightData | null;
  isLoadingSpotlightPreview: boolean;
  adminPublishedEvents: Array<{ id: string; title: string; slug?: string; date?: string }>;
  isSaving: boolean;
  handleSavePlatformOps: () => void;
}

export function SpotlightBannerSection({
  locale,
  eventBannerEnabled,
  setEventBannerEnabled,
  eventBannerMode,
  setEventBannerMode,
  eventBannerCriteria,
  setEventBannerCriteria,
  eventBannerPinnedEventId,
  setEventBannerPinnedEventId,
  eventBannerCustomBadge,
  setEventBannerCustomBadge,
  eventBannerCustomText,
  setEventBannerCustomText,
  spotlightPreview,
  isLoadingSpotlightPreview,
  adminPublishedEvents,
  isSaving,
  handleSavePlatformOps,
}: SpotlightBannerSectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-6 w-full min-w-0 overflow-hidden">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">
              {locale === "en" ? "Top Event Spotlight Banner" : "Banner Superior de Eventos (Spotlight)"}
            </h2>
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              {locale === "en" ? "Dynamic" : "Dinámico"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "en"
              ? "Highlights a top event (most popular, starting soon, few tickets left, or pinned) in the header bar with high conversion."
              : "Muestra en la cabecera superior un evento destacado de forma automática (más popular, próximo, últimos cupos) o fijado por ti."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEventBannerEnabled(!eventBannerEnabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            eventBannerEnabled ? "bg-primary" : "bg-muted-foreground/30"
          }`}
          aria-pressed={eventBannerEnabled}
          aria-label={locale === "en" ? "Toggle event spotlight banner" : "Activar banner de eventos"}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
              eventBannerEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Live Preview */}
      <div className="space-y-2 rounded-xl border border-dashed border-border/80 bg-muted/20 p-4 w-full min-w-0 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-primary" />
            {locale === "en" ? "Live preview" : "Vista previa en vivo"}
          </span>
          {isLoadingSpotlightPreview && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              {locale === "en" ? "Updating preview..." : "Actualizando vista..."}
            </span>
          )}
        </div>
        <div className="pt-1 w-full min-w-0 overflow-hidden">
          {spotlightPreview ? (
            <EventSpotlightBanner event={spotlightPreview} isPreview={true} />
          ) : (
            <div className="rounded-lg border border-border bg-background/50 p-4 text-center text-xs text-muted-foreground">
              {locale === "en"
                ? "No active published event currently matches this configuration."
                : "No hay eventos publicados activos que coincidan con esta configuración."}
            </div>
          )}
        </div>
      </div>

      <SpotlightModeSelector
        locale={locale}
        eventBannerEnabled={eventBannerEnabled}
        eventBannerMode={eventBannerMode}
        setEventBannerMode={setEventBannerMode}
        eventBannerCriteria={eventBannerCriteria}
        setEventBannerCriteria={setEventBannerCriteria}
        eventBannerPinnedEventId={eventBannerPinnedEventId}
        setEventBannerPinnedEventId={setEventBannerPinnedEventId}
        adminPublishedEvents={adminPublishedEvents}
      />

      <SpotlightCustomFields
        locale={locale}
        eventBannerEnabled={eventBannerEnabled}
        eventBannerCustomBadge={eventBannerCustomBadge}
        setEventBannerCustomBadge={setEventBannerCustomBadge}
        eventBannerCustomText={eventBannerCustomText}
        setEventBannerCustomText={setEventBannerCustomText}
      />

      <div className="pt-1 flex justify-end">
        <button
          type="button"
          onClick={handleSavePlatformOps}
          disabled={isSaving}
          className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50 shadow-sm"
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {locale === "en" ? "Save event banner settings" : "Guardar banner de eventos"}
        </button>
      </div>
    </div>
  );
}
