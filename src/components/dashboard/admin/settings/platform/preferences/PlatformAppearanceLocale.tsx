"use client";

import { Check, Clock, Globe, Loader2, Save } from "lucide-react";
import {
    PLATFORM_TIMEZONE_OPTIONS,
    normalizePlatformLocale,
    normalizePlatformTimezone,
    getTimezoneDisplayLabel,
    getTimezoneOffsetLabel,
} from "@/lib/settings/platform-locale";
import {
    ACCENT_COLORS,
    type AccentColor,
} from "@/components/dashboard/admin/AccentColorInitializer";
import { PersonalAppearancePreferences } from "@/components/dashboard/appearance/PersonalAppearancePreferences";
import type { SystemSettings } from "@/lib/settings";

interface PlatformAppearanceLocaleProps {
    locale: "es" | "en";
    initialPlatformSettings: SystemSettings;
    platformAccentDraft: AccentColor;
    setPlatformAccentDraft: (val: AccentColor) => void;
    platformDefaultAccent?: AccentColor;
    platformLocaleDraft: "es" | "en";
    setPlatformLocaleDraft: (val: "es" | "en") => void;
    platformTimezoneDraft: string;
    setPlatformTimezoneDraft: (val: string) => void;
    previewClock: string;
    isSaving: boolean;
    handleSavePlatformAccent: () => void;
    handleSavePlatformLocaleTimezone: () => void;
}

export function PlatformAppearanceLocale({
    locale,
    initialPlatformSettings,
    platformAccentDraft,
    setPlatformAccentDraft,
    platformDefaultAccent,
    platformLocaleDraft,
    setPlatformLocaleDraft,
    platformTimezoneDraft,
    setPlatformTimezoneDraft,
    previewClock,
    isSaving,
    handleSavePlatformAccent,
    handleSavePlatformLocaleTimezone,
}: PlatformAppearanceLocaleProps) {
    return (
        <>
            {/* Platform Default Accent */}
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

            {/* Language & Timezone */}
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
        </>
    );
}
