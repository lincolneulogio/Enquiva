"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import { PersonalAppearancePreferences } from "@/components/dashboard/appearance/PersonalAppearancePreferences";
import type { AccentColor } from "@/components/dashboard/admin/AccentColorInitializer";

interface EntityAppearanceTabProps {
    platformDefaultAccent?: AccentColor;
}

export function EntityAppearanceTab({ platformDefaultAccent }: EntityAppearanceTabProps) {
    const { locale, setLocale, isPending: isLocalePending } = useLocale();

    return (
        <div className="space-y-6">
            <PersonalAppearancePreferences
                platformDefaultAccent={platformDefaultAccent ?? "indigo"}
            />

            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-3">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">
                        {locale === "en" ? "Panel language" : "Idioma de la interfaz"}
                    </h2>
                </div>
                <div className="flex gap-3 pt-1 select-none">
                    <button
                        type="button"
                        onClick={() => setLocale("es")}
                        disabled={isLocalePending}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 disabled:opacity-50 ${
                            locale === "es"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background text-foreground hover:bg-muted"
                        }`}
                    >
                        <span>🇪🇸</span>
                        Español
                    </button>
                    <button
                        type="button"
                        onClick={() => setLocale("en")}
                        disabled={isLocalePending}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 disabled:opacity-50 ${
                            locale === "en"
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-background text-foreground hover:bg-muted"
                        }`}
                    >
                        <span>🇺🇸</span>
                        English
                    </button>
                </div>
            </div>
        </div>
    );
}
