"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import {
  THEME_STORAGE_KEY,
  parseAppTheme,
  readThemeCookie,
  resolveThemeCookieDomain,
  writeThemeCookie,
  type AppTheme,
} from "@/lib/theme/cookie";

const cookieDomain = resolveThemeCookieDomain(
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_DOCS_URL,
);

function applyLocalTheme(theme: AppTheme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore quota / private mode */
  }
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/**
 * Mantiene el tema del panel alineado con docs vía cookie compartida
 * (localhost: puertos distintos; prod: Domain compartido).
 */
export function ThemeCrossAppSync() {
  const { theme, setTheme } = useTheme();
  const lastWritten = useRef<AppTheme | null>(null);

  useEffect(() => {
    if (theme !== "light" && theme !== "dark") return;
    if (lastWritten.current === theme) return;
    lastWritten.current = theme;
    writeThemeCookie(theme, cookieDomain);
    applyLocalTheme(theme);
  }, [theme]);

  useEffect(() => {
    const syncFromShared = () => {
      const fromCookie = readThemeCookie();
      if (!fromCookie) return;

      const current =
        parseAppTheme(theme) ??
        parseAppTheme(
          typeof localStorage !== "undefined"
            ? localStorage.getItem(THEME_STORAGE_KEY)
            : null,
        );

      if (fromCookie === current) return;
      lastWritten.current = fromCookie;
      applyLocalTheme(fromCookie);
      setTheme(fromCookie);
    };

    syncFromShared();
    const id = window.setInterval(syncFromShared, 400);
    window.addEventListener("focus", syncFromShared);
    document.addEventListener("visibilitychange", syncFromShared);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", syncFromShared);
      document.removeEventListener("visibilitychange", syncFromShared);
    };
  }, [theme, setTheme]);

  return null;
}
