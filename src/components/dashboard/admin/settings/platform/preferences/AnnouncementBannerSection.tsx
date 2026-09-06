"use client";

import { Megaphone, Clock, Loader2, Save } from "lucide-react";
import type { AnnouncementSeverity } from "@/lib/settings/platform-ops";

interface AnnouncementBannerSectionProps {
    locale: "es" | "en";
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
    isSaving: boolean;
    handleSavePlatformOps: () => void;
}

export function AnnouncementBannerSection({
    locale,
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
    isSaving,
    handleSavePlatformOps,
}: AnnouncementBannerSectionProps) {
    return (
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
                            ? 'Site-wide notice with optional schedule and event time (e.g. "maintenance on Jul 20 at 3pm").'
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
                        ? 'Example: Jul 20, 3:00 PM — users see the date + relative time ("in 2 days").'
                        : 'Ejemplo: 20 jul, 15:00 — el usuario ve la fecha y el tiempo relativo ("en 2 días").'}
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
    );
}
