"use client";

import React from "react";
import {
    Wrench,
    Clock,
    Megaphone,
    Sparkles,
    Eye,
    Zap,
    Star,
    Flame,
    Globe,
    Check,
    Save,
    Loader2,
} from "lucide-react";
import { EventSpotlightBanner } from "@/components/shared/EventSpotlightBanner";
import type { EventSpotlightData } from "@/services/events/event-spotlight.service";
import {
    PLATFORM_TIMEZONE_OPTIONS,
    normalizePlatformLocale,
    normalizePlatformTimezone,
    getTimezoneDisplayLabel,
    getTimezoneOffsetLabel,
} from "@/lib/settings/platform-locale";
import type { AnnouncementSeverity } from "@/lib/settings/platform-ops";
import {
    ACCENT_COLORS,
    type AccentColor,
} from "@/components/dashboard/admin/AccentColorInitializer";
import { PersonalAppearancePreferences } from "@/components/dashboard/appearance/PersonalAppearancePreferences";
import type { SystemSettings } from "@/lib/settings";

interface PlatformPreferencesTabProps {
    locale: "es" | "en";
    initialPlatformSettings: SystemSettings;
    // Maintenance
    maintenanceMode: boolean;
    setMaintenanceMode: (val: boolean) => void;
    maintenanceMessage: string;
    setMaintenanceMessage: (val: string) => void;
    maintenanceStartsLocal: string;
    setMaintenanceStartsLocal: (val: string) => void;
    maintenanceEndsLocal: string;
    setMaintenanceEndsLocal: (val: string) => void;
    // Announcement
    announcementEnabled: boolean;
    setAnnouncementEnabled: (val: boolean) => void;
    announcementMessage: string;
    setAnnouncementMessage: (val: string) => void;
    announcementEventLocal: string;
    setAnnouncementEventLocal: (val: string) => void;
    announcementStartsLocal: string;
    setAnnouncementStartsLocal: (val: string) => void;
    announcementEndsLocal: string;
    setAnnouncementEndsLocal: (val: string) => void;
    announcementSeverity: AnnouncementSeverity;
    setAnnouncementSeverity: (val: AnnouncementSeverity) => void;
    announcementDismissible: boolean;
    setAnnouncementDismissible: (val: boolean) => void;
    // Spotlight Banner
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
    // Platform Accent
    platformAccentDraft: AccentColor;
    setPlatformAccentDraft: (val: AccentColor) => void;
    platformDefaultAccent?: AccentColor;
    // Locale & Timezone
    platformLocaleDraft: "es" | "en";
    setPlatformLocaleDraft: (val: "es" | "en") => void;
    platformTimezoneDraft: string;
    setPlatformTimezoneDraft: (val: string) => void;
    previewClock: string;
    // Handlers & State
    isSaving: boolean;
    handleSavePlatformOps: () => void;
    handleSavePlatformAccent: () => void;
    handleSavePlatformLocaleTimezone: () => void;
}

export function PlatformPreferencesTab({
    locale,
    initialPlatformSettings,
    maintenanceMode,
    setMaintenanceMode,
    maintenanceMessage,
    setMaintenanceMessage,
    maintenanceStartsLocal,
    setMaintenanceStartsLocal,
    maintenanceEndsLocal,
    setMaintenanceEndsLocal,
    announcementEnabled,
    setAnnouncementEnabled,
    announcementMessage,
    setAnnouncementMessage,
    announcementEventLocal,
    setAnnouncementEventLocal,
    announcementStartsLocal,
    setAnnouncementStartsLocal,
    announcementEndsLocal,
    setAnnouncementEndsLocal,
    announcementSeverity,
    setAnnouncementSeverity,
    announcementDismissible,
    setAnnouncementDismissible,
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
    platformAccentDraft,
    setPlatformAccentDraft,
    platformDefaultAccent,
    platformLocaleDraft,
    setPlatformLocaleDraft,
    platformTimezoneDraft,
    setPlatformTimezoneDraft,
    previewClock,
    isSaving,
    handleSavePlatformOps,
    handleSavePlatformAccent,
    handleSavePlatformLocaleTimezone,
}: PlatformPreferencesTabProps) {
    return (
        <div className="w-full min-w-0 max-w-full space-y-6">
            {/* Modo Mantenimiento */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5 w-full min-w-0">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
                        <Wrench className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-foreground">
                            {locale === "en" ? "Maintenance mode" : "Modo mantenimiento"}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {locale === "en"
                                ? "Manual switch or scheduled window. Super admins keep access; tickets and login stay available."
                                : "Activación manual o ventana programada. Los superadmins conservan acceso; tickets e inicio de sesión siguen disponibles."}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setMaintenanceMode(!maintenanceMode)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                            maintenanceMode ? "bg-amber-600" : "bg-muted-foreground/30"
                        }`}
                        aria-pressed={maintenanceMode}
                        aria-label={locale === "en" ? "Toggle maintenance mode" : "Activar modo mantenimiento"}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                maintenanceMode ? "translate-x-5" : "translate-x-0"
                            }`}
                        />
                    </button>
                </div>

                {maintenanceMode && (
                    <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
                        {locale === "en"
                            ? "Manual maintenance is ON — users are redirected to /maintenance until you turn this off."
                            : "Mantenimiento manual ACTIVO — los usuarios van a /maintenance hasta que lo desactives."}
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                        {locale === "en" ? "Message shown to users" : "Mensaje mostrado a los usuarios"}
                    </label>
                    <textarea
                        value={maintenanceMessage}
                        onChange={(e) => setMaintenanceMessage(e.target.value)}
                        rows={3}
                        maxLength={500}
                        placeholder={
                            locale === "en"
                                ? "We are upgrading the platform. Back shortly…"
                                : "Estamos mejorando la plataforma. Volvemos en breve…"
                        }
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-y min-h-[80px]"
                    />
                    <p className="text-[11px] text-muted-foreground text-right">
                        {maintenanceMessage.length}/500
                    </p>
                </div>

                <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/[0.04] p-4 space-y-3 w-full min-w-0">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                        <p className="text-xs font-semibold text-foreground">
                            {locale === "en" ? "Scheduled window (optional)" : "Ventana programada (opcional)"}
                        </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                        {locale === "en"
                            ? "Auto-activates maintenance between these times (platform timezone), even if the manual switch is off. Clear both to disable schedule."
                            : "Activa el mantenimiento solo entre estas horas (zona de plataforma), aunque el interruptor manual esté apagado. Vacía ambos para quitar la programación."}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 w-full min-w-0">
                        <div className="space-y-1 min-w-0">
                            <label className="text-[11px] font-semibold text-foreground">
                                {locale === "en" ? "Starts" : "Inicio"}
                            </label>
                            <input
                                type="datetime-local"
                                value={maintenanceStartsLocal}
                                onChange={(e) => setMaintenanceStartsLocal(e.target.value)}
                                className="w-full min-w-0 max-w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                            />
                        </div>
                        <div className="space-y-1 min-w-0">
                            <label className="text-[11px] font-semibold text-foreground">
                                {locale === "en" ? "Ends" : "Fin"}
                            </label>
                            <input
                                type="datetime-local"
                                value={maintenanceEndsLocal}
                                onChange={(e) => setMaintenanceEndsLocal(e.target.value)}
                                className="w-full min-w-0 max-w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                            />
                        </div>
                    </div>
                    {(maintenanceStartsLocal || maintenanceEndsLocal) && (
                        <button
                            type="button"
                            onClick={() => {
                                setMaintenanceStartsLocal("");
                                setMaintenanceEndsLocal("");
                            }}
                            className="text-[11px] font-semibold text-amber-800 dark:text-amber-200 underline-offset-2 hover:underline"
                        >
                            {locale === "en" ? "Clear schedule" : "Limpiar programación"}
                        </button>
                    )}
                </div>
            </div>

            {/* Banner de Avisos */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5 w-full min-w-0">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
                        <Megaphone className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-foreground">
                            {locale === "en" ? "Announcement banner" : "Banner de avisos"}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {locale === "en"
                                ? "Site-wide notice with optional schedule and event time (e.g. “maintenance on Jul 20 at 3pm”)."
                                : "Aviso en toda la app con horario opcional y fecha del evento (ej. mantenimiento el 20 jul a las 15:00)."}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setAnnouncementEnabled(!announcementEnabled)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                            announcementEnabled ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                        aria-pressed={announcementEnabled}
                        aria-label={locale === "en" ? "Toggle announcement banner" : "Activar banner de avisos"}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                announcementEnabled ? "translate-x-5" : "translate-x-0"
                            }`}
                        />
                    </button>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                        {locale === "en" ? "Banner message" : "Mensaje del banner"}
                    </label>
                    <textarea
                        value={announcementMessage}
                        onChange={(e) => setAnnouncementMessage(e.target.value)}
                        rows={2}
                        maxLength={400}
                        disabled={!announcementEnabled}
                        placeholder={
                            locale === "en"
                                ? "We will perform platform maintenance. Expect brief interruptions."
                                : "Realizaremos mantenimiento de plataforma. Puede haber interrupciones breves."
                        }
                        className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-y min-h-[64px] disabled:opacity-50"
                    />
                    <p className="text-[11px] text-muted-foreground text-right">
                        {announcementMessage.length}/400
                    </p>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {locale === "en"
                            ? "Highlighted event time (shown on banner)"
                            : "Fecha/hora del evento (chip en el banner)"}
                    </label>
                    <input
                        type="datetime-local"
                        value={announcementEventLocal}
                        onChange={(e) => setAnnouncementEventLocal(e.target.value)}
                        disabled={!announcementEnabled}
                        className="w-full min-w-0 max-w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                    />
                    <p className="text-[11px] text-muted-foreground">
                        {locale === "en"
                            ? "Example: Jul 20, 3:00 PM — users see the date + relative time (“in 2 days”)."
                            : "Ejemplo: 20 jul, 15:00 — el usuario ve la fecha y el tiempo relativo (“en 2 días”)."}
                    </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3 w-full min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                        {locale === "en" ? "When to show the banner" : "Cuándo mostrar el banner"}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 w-full min-w-0">
                        <div className="space-y-1 min-w-0">
                            <label className="text-[11px] font-semibold text-foreground">
                                {locale === "en" ? "Show from" : "Mostrar desde"}
                            </label>
                            <input
                                type="datetime-local"
                                value={announcementStartsLocal}
                                onChange={(e) => setAnnouncementStartsLocal(e.target.value)}
                                disabled={!announcementEnabled}
                                className="w-full min-w-0 max-w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                            />
                        </div>
                        <div className="space-y-1 min-w-0">
                            <label className="text-[11px] font-semibold text-foreground">
                                {locale === "en" ? "Hide after" : "Ocultar después de"}
                            </label>
                            <input
                                type="datetime-local"
                                value={announcementEndsLocal}
                                onChange={(e) => setAnnouncementEndsLocal(e.target.value)}
                                disabled={!announcementEnabled}
                                className="w-full min-w-0 max-w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                            />
                        </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                        {locale === "en"
                            ? "Leave empty to show whenever the banner is enabled. Times use the platform timezone."
                            : "Vacío = se muestra mientras el banner esté activo. Las horas usan la zona horaria de la plataforma."}
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-foreground">
                            {locale === "en" ? "Severity" : "Severidad"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {(
                                [
                                    { id: "info", labelEs: "Info", labelEn: "Info" },
                                    { id: "warning", labelEs: "Aviso", labelEn: "Warning" },
                                    { id: "critical", labelEs: "Crítico", labelEn: "Critical" },
                                ] as const
                            ).map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    disabled={!announcementEnabled}
                                    onClick={() => setAnnouncementSeverity(opt.id)}
                                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                                        announcementSeverity === opt.id
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border bg-background text-foreground hover:bg-muted"
                                    }`}
                                >
                                    {locale === "en" ? opt.labelEn : opt.labelEs}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/10 p-3">
                        <div>
                            <p className="text-xs font-semibold text-foreground">
                                {locale === "en" ? "Dismissible" : "Se puede cerrar"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                {locale === "en"
                                    ? "Users can hide it for this browser session"
                                    : "Los usuarios pueden ocultarlo en esta sesión"}
                            </p>
                        </div>
                        <button
                            type="button"
                            disabled={!announcementEnabled}
                            onClick={() => setAnnouncementDismissible(!announcementDismissible)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
                                announcementDismissible ? "bg-primary" : "bg-muted-foreground/30"
                            }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                    announcementDismissible ? "translate-x-5" : "translate-x-0"
                                }`}
                            />
                        </button>
                    </div>
                </div>

                <div className="pt-1 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSavePlatformOps}
                        disabled={isSaving}
                        className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {locale === "en" ? "Save status & banner" : "Guardar estado y avisos"}
                    </button>
                </div>
            </div>

            {/* Banner Superior de Eventos (Spotlight) */}
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

                {/* Vista Previa en Vivo */}
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

                {/* Modo del Banner */}
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

                {/* Opciones automáticas */}
                {eventBannerMode === "auto" && (
                    <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Flame className="h-3.5 w-3.5 text-orange-500" />
                            {locale === "en" ? "Preferred dynamic criterion" : "Criterio de prioridad dinámica"}
                        </label>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            {(
                                [
                                    {
                                        id: "auto",
                                        labelEs: "Balanceado (Auto)",
                                        labelEn: "Balanced (Auto)",
                                        descEs: "Cupos > Próximo > Popular",
                                    },
                                    {
                                        id: "few_tickets",
                                        labelEs: "⚡ Últimos Cupos",
                                        labelEn: "⚡ Few Tickets",
                                        descEs: "Eventos con <15 cupos o 80% lleno",
                                    },
                                    {
                                        id: "popular",
                                        labelEs: "🔥 Más Popular",
                                        labelEn: "🔥 Most Popular",
                                        descEs: "Mayor interacción y registros",
                                    },
                                    {
                                        id: "upcoming",
                                        labelEs: "⏳ Próximo a Iniciar",
                                        labelEn: "⏳ Starting Soon",
                                        descEs: "Comienza en menos de 72h",
                                    },
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

                {/* Opciones de modo fijado */}
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

                {/* Textos personalizados */}
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
                            {locale === "en" ? "Custom Highlight Text (Optional)" : "Mensaje de urgencia personalizado (Opcional)"}
                        </label>
                        <input
                            type="text"
                            value={eventBannerCustomText}
                            onChange={(e) => setEventBannerCustomText(e.target.value)}
                            disabled={!eventBannerEnabled}
                            maxLength={100}
                            placeholder={locale === "en" ? "e.g. Last 5 tickets with 20% OFF" : "ej. ¡Últimas 10 entradas disponibles!"}
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

            {/* Acento por defecto de la plataforma */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">
                        {locale === "en"
                            ? "Platform default accent"
                            : "Color de acento por defecto (plataforma)"}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {locale === "en"
                            ? "Applies to all users who have not chosen a personal accent. Saved in the database."
                            : "Aplica a todos los usuarios que no hayan elegido un color personal. Se guarda en la base de datos."}
                    </p>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                    {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((key) => {
                        const config = ACCENT_COLORS[key];
                        const isSelected = platformAccentDraft === key;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setPlatformAccentDraft(key)}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 hover:scale-103 ${
                                    isSelected
                                        ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                                        : "border-border bg-background hover:border-primary/50"
                                }`}
                            >
                                <span
                                    className={`h-4.5 w-4.5 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold ${config.class} shadow-inner`}
                                >
                                    {isSelected && "✓"}
                                </span>
                                <span className="text-foreground text-xs font-semibold">{config.name}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="pt-1 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSavePlatformAccent}
                        disabled={isSaving || platformAccentDraft === platformDefaultAccent}
                        className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {locale === "en" ? "Save platform accent" : "Guardar acento de plataforma"}
                    </button>
                </div>
            </div>

            {/* Idioma y Zona Horaria */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Globe className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-foreground">
                            {locale === "en"
                                ? "Platform language & reference timezone"
                                : "Idioma y zona horaria de la plataforma"}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {locale === "en"
                                ? "Global defaults for new users, notification dispatches, event schedules, and the AI assistant."
                                : "Configuración global que rige para nuevos usuarios, envíos de correo, fechas de eventos y el asistente Copilot IA."}
                        </p>
                    </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2.5">
                        <div>
                            <p className="text-xs font-semibold text-foreground">
                                {locale === "en" ? "Default language (new accounts)" : "Idioma base de plataforma"}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {locale === "en"
                                    ? "Initial language for visitors and newly registered accounts."
                                    : "Idioma inicial para nuevos visitantes y cuentas registradas."}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {[
                                {
                                    id: "es" as const,
                                    code: "ES",
                                    label: "Español",
                                    region: locale === "en" ? "LatAm & Spain" : "Latinoamérica y España",
                                },
                                {
                                    id: "en" as const,
                                    code: "EN",
                                    label: "English",
                                    region: locale === "en" ? "Global & US" : "Global e Internacional",
                                },
                            ].map((opt) => {
                                const isSelected = platformLocaleDraft === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setPlatformLocaleDraft(opt.id)}
                                        className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition ${
                                            isSelected
                                                ? "border-primary bg-primary/10 text-primary ring-1 ring-primary shadow-sm"
                                                : "border-border bg-background text-foreground hover:bg-muted/70"
                                        }`}
                                    >
                                        <span
                                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold ${
                                                isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted text-muted-foreground"
                                            }`}
                                        >
                                            {opt.code}
                                        </span>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                                                {opt.label}
                                                {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground truncate">
                                                {opt.region}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <div>
                            <label
                                htmlFor="platform-timezone"
                                className="text-xs font-semibold text-foreground inline-flex items-center gap-1.5"
                            >
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                {locale === "en" ? "Official platform timezone" : "Zona horaria oficial"}
                            </label>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {locale === "en"
                                    ? "Applied to event schedules, reports, and AI Copilot queries."
                                    : "Aplica al calendario de eventos, reportes y al Copilot IA."}
                            </p>
                        </div>
                        <select
                            id="platform-timezone"
                            value={platformTimezoneDraft}
                            onChange={(e) =>
                                setPlatformTimezoneDraft(normalizePlatformTimezone(e.target.value))
                            }
                            className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        >
                            {PLATFORM_TIMEZONE_OPTIONS.map((tz) => (
                                <option key={tz.value} value={tz.value}>
                                    {getTimezoneDisplayLabel(tz, locale)}
                                </option>
                            ))}
                            {!PLATFORM_TIMEZONE_OPTIONS.some((tz) => tz.value === platformTimezoneDraft) ? (
                                <option value={platformTimezoneDraft}>
                                    {platformTimezoneDraft} ({getTimezoneOffsetLabel(platformTimezoneDraft)})
                                </option>
                            ) : null}
                        </select>
                    </div>
                </div>

                <div className="rounded-lg border border-border/80 bg-muted/30 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-foreground min-w-0">
                        <Clock className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium text-muted-foreground shrink-0">
                            {locale === "en" ? "Active time preview:" : "Hora activa en esta zona:"}
                        </span>
                        <span className="font-mono text-foreground font-semibold truncate">
                            {previewClock || "..."}
                        </span>
                    </div>
                    <span className="inline-flex items-center self-start sm:self-auto rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        ● {locale === "en" ? "Copilot & platform synced" : "Copilot e informes sincronizados"}
                    </span>
                </div>

                <div className="pt-1 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSavePlatformLocaleTimezone}
                        disabled={
                            isSaving ||
                            (platformLocaleDraft === normalizePlatformLocale(initialPlatformSettings.defaultLocale) &&
                                platformTimezoneDraft === normalizePlatformTimezone(initialPlatformSettings.defaultTimezone))
                        }
                        className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {locale === "en" ? "Save language & timezone" : "Guardar idioma y zona horaria"}
                    </button>
                </div>
            </div>

            {/* Personal Appearance */}
            <PersonalAppearancePreferences
                platformDefaultAccent={platformDefaultAccent ?? "indigo"}
            />

            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-3">
                <p className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground leading-relaxed">
                    {locale === "en"
                        ? "Your personal interface language is controlled with ES / EN in the top bar. It overrides the platform default above for this browser only."
                        : "Tu idioma personal se cambia con ES / EN en la barra superior. Solo afecta este navegador y tiene prioridad sobre el idioma por defecto de arriba."}
                </p>
            </div>
        </div>
    );
}
