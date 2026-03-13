"use client";

import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localeOptions } from "@/lib/i18n/core";

export function LanguageSwitcher() {
    const { locale, setLocale, isPending, t } = useLocale();

    return (
        <div
            className="flex shrink-0 items-center gap-0.5 rounded-xl border border-border bg-secondary/50 p-1 sm:gap-1 sm:p-1"
            aria-label={t("common.language")}
            title={t("common.language")}
        >
            <span className="hidden h-7 w-7 items-center justify-center text-muted-foreground sm:flex sm:h-8 sm:w-8">
                <Globe className="h-4 w-4" />
            </span>
            {localeOptions.map((option) => {
                const active = option.value === locale;
                return (
                    <button
                        key={option.value}
                        type="button"
                        disabled={isPending}
                        onClick={() => setLocale(option.value)}
                        className={cn(
                            "rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 sm:px-2.5 sm:py-1.5",
                            active
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                        )}
                        aria-pressed={active}
                    >
                        {option.value.toUpperCase()}
                    </button>
                );
            })}
        </div>
    );
}
