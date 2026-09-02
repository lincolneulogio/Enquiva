"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useAppTheme } from "@/components/providers/AppThemeProvider";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const t = useTranslations();
  const { theme, setTheme } = useAppTheme();
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
        "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/40 text-sm text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground",
        showLabel ? "px-2.5 sm:px-3" : "w-10 px-0",
        className,
      )}
    >
      {mounted && isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {showLabel ? <span className="hidden lg:inline">{label}</span> : null}
    </button>
  );
}
