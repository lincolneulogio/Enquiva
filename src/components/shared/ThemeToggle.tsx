"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
    className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
    const t = useTranslations();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = theme === "dark";
    const nextTheme = isDark ? "light" : "dark";
    const label = isDark ? t("common.switchToLight") : t("common.switchToDark");

    return (
        <button
            type="button"
            onClick={() => mounted && setTheme(nextTheme)}
            title={label}
            aria-label={label}
            className={cn(
                "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:px-3",
                className
            )}
        >
            {mounted && isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="hidden lg:inline">{label}</span>
        </button>
    );
}
