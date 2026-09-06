"use client";

import { Sparkles, Eye, Zap, Star, Flame, Loader2, Save } from "lucide-react";
import { EventSpotlightBanner } from "@/components/shared/EventSpotlightBanner";
import type { EventSpotlightData } from "@/services/events/event-spotlight.service";

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
    adminPublishedEvents: Array<{ id: string; title: string; date: string }>;
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
                                    {ev.title} ({new Date(ev.date).toLocaleDateString(locale === "en" ? "en-US" : "es-PE")})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Custom text fields */}
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
