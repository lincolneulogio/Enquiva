"use client";

import { useEffect } from "react";
import {
  applyAccentColor,
  resolveEffectiveAccent,
  type AccentColor,
  ACCENT_COLORS,
  DEFAULT_ACCENT_COLOR,
  isAccentColor,
} from "@/lib/brand/accent";

export {
  ACCENT_COLORS,
  applyAccentColor,
  setAccentOverride,
  clearAccentOverride,
  hasAccentOverride,
  resolveEffectiveAccent,
  DEFAULT_ACCENT_COLOR,
  isAccentColor,
  type AccentColor,
} from "@/lib/brand/accent";

interface AccentColorInitializerProps {
  /** Color por defecto de toda la plataforma (desde BD). */
  platformDefault?: AccentColor | string;
}

export function AccentColorInitializer({
  platformDefault = DEFAULT_ACCENT_COLOR,
}: AccentColorInitializerProps) {
  const safeDefault: AccentColor = isAccentColor(platformDefault)
    ? platformDefault
    : DEFAULT_ACCENT_COLOR;

  useEffect(() => {
    const updateColors = () => {
      const isDark = document.documentElement.classList.contains("dark");
      const effective = resolveEffectiveAccent(safeDefault);
      applyAccentColor(effective, isDark);
    };

    updateColors();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "class") {
          updateColors();
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Otras pestañas: override / color efectivo
    const onStorage = (e: StorageEvent) => {
      if (e.key === "brand-accent" || e.key === "brand-accent-override") {
        updateColors();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", onStorage);
    };
  }, [safeDefault]);

  return null;
}
