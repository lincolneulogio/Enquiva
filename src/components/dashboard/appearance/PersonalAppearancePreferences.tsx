"use client";

import { useEffect, useState } from "react";
import { useAppTheme } from "@/components/providers/AppThemeProvider";
import { toast } from "sonner";
import { Moon, Palette, Sun } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";
import {
  ACCENT_COLORS,
  clearAccentOverride,
  hasAccentOverride,
  isAccentColor,
  resolveEffectiveAccent,
  setAccentOverride,
  type AccentColor,
  DEFAULT_ACCENT_COLOR,
} from "@/lib/brand/accent";

type PersonalAppearancePreferencesProps = {
  platformDefaultAccent: AccentColor | string;
  /** Incluye selector claro/oscuro. Default true. */
  showTheme?: boolean;
  className?: string;
};

export function PersonalAppearancePreferences({
  platformDefaultAccent: platformDefaultAccentProp,
  showTheme = true,
  className,
}: PersonalAppearancePreferencesProps) {
  const { locale } = useLocale();
  const { theme, setTheme } = useAppTheme();

  const platformDefaultAccent: AccentColor = isAccentColor(platformDefaultAccentProp)
    ? platformDefaultAccentProp
    : DEFAULT_ACCENT_COLOR;

  const [followsPlatform, setFollowsPlatform] = useState(true);
  const [activeAccent, setActiveAccent] = useState<AccentColor>(platformDefaultAccent);

  useEffect(() => {
    const sync = () => {
      const follows = !hasAccentOverride();
      const followsPlatformNext = follows;
      setFollowsPlatform(followsPlatformNext);
      setActiveAccent(resolveEffectiveAccent(platformDefaultAccent));
    };
    sync();
    window.addEventListener("brand-accent-changed", sync);
    return () => window.removeEventListener("brand-accent-changed", sync);
  }, [platformDefaultAccent]);

  const handleFollowToggle = () => {
    if (followsPlatform) {
      // Activar preferencia personal partiendo del color actual visible.
      const start = resolveEffectiveAccent(platformDefaultAccent);
      setAccentOverride(start);
      setFollowsPlatform(false);
      setActiveAccent(start);
      toast.success(
        locale === "en"
          ? "Personal accent enabled — pick a color below"
          : "Acento personal activado — elige un color abajo",
      );
      return;
    }

    const platformAccent = platformDefaultAccent;
    clearAccentOverride(platformAccent);
    setFollowsPlatform(true);
    setActiveAccent(platformAccent);
    toast.success(
      locale === "en"
        ? `Using platform accent (${ACCENT_COLORS[platformAccent].name})`
        : `Usando acento de plataforma (${ACCENT_COLORS[platformAccent].name})`,
    );
  };

  const handlePersonalAccent = (color: AccentColor) => {
    const nextColor = color;
    setAccentOverride(nextColor);
    setFollowsPlatform(false);
    setActiveAccent(nextColor);
    toast.success(
      locale === "en"
        ? `Accent color set to ${ACCENT_COLORS[nextColor].name}`
        : `Color de acento: ${ACCENT_COLORS[nextColor].name}`,
    );
  };

  return (
    <div className={className ?? "rounded-xl border border-border bg-card p-4 sm:p-6 space-y-6"}>
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {locale === "en" ? "Appearance" : "Apariencia"}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {locale === "en"
            ? "Personal preference for this browser. Does not change the platform default for other users."
            : "Preferencia personal de este navegador. No cambia el acento por defecto de la plataforma para otros usuarios."}
        </p>
      </div>

      <div className="flex items-start sm:items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Palette className="h-4 w-4" />
          </div>
          <div className="min-w-0 space-y-0.5 pr-1">
            <p className="text-sm font-semibold text-foreground">
              {locale === "en" ? "Use platform accent" : "Usar acento de la plataforma"}
            </p>
            <p className="text-xs text-muted-foreground">
              {locale === "en"
                ? `Follow the admin default (${ACCENT_COLORS[platformDefaultAccent].name}). Turn off to choose your own.`
                : `Seguir el color por defecto (${ACCENT_COLORS[platformDefaultAccent].name}). Desactívalo para elegir el tuyo.`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleFollowToggle}
          aria-pressed={followsPlatform}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            followsPlatform ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
              followsPlatform ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div
        className={`space-y-3 transition-opacity ${followsPlatform ? "opacity-50" : "opacity-100"}`}
      >
        <p className="text-sm font-medium text-foreground">
          {locale === "en" ? "Personal accent" : "Acento personal"}
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((key) => {
            const config = ACCENT_COLORS[key];
            const isSelected = !followsPlatform && activeAccent === key;
            return (
              <button
                key={key}
                type="button"
                disabled={followsPlatform}
                onClick={() => handlePersonalAccent(key)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 disabled:cursor-not-allowed disabled:hover:scale-100 hover:scale-103 ${
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
      </div>

      {showTheme && (
        <>
          <hr className="border-border" />
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              {locale === "en" ? "App theme" : "Tema del sistema"}
            </p>
            <div className="flex flex-wrap gap-3 select-none">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                  theme === "light"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                <Sun className="h-4 w-4" />
                {locale === "en" ? "Light" : "Modo claro"}
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                  theme === "dark"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                <Moon className="h-4 w-4" />
                {locale === "en" ? "Dark" : "Modo oscuro"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
