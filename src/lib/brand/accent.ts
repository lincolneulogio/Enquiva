export type AccentColor = "amber" | "emerald" | "rose" | "blue";

export const DEFAULT_ACCENT_COLOR: AccentColor = "amber";

export const ACCENT_STORAGE_KEY = "brand-accent";
/** "1" = preferencia personal; "0" = seguir acento de plataforma. */
export const ACCENT_OVERRIDE_KEY = "brand-accent-override";

type AccentModeConfig = {
  primary: string;
  ring: string;
  accent: string;
  background: string;
  foreground: string;
  border: string;
  /** Superficie de cards / popovers. Debe seguir el hue del acento. */
  card: string;
  secondary: string;
  muted: string;
  mutedForeground: string;
  sidebarBackground: string;
  sidebarAccent: string;
  sidebarBorder: string;
  sidebarForeground: string;
  /** Pie de perfil: variante del primary sobre el sidebar, por acento y modo. */
  sidebarFooter: string;
};

const PRIMARY_FOREGROUND = "0 0% 100%";

export const ACCENT_COLORS: Record<
  AccentColor,
  {
    name: string;
    class: string;
    light: AccentModeConfig;
    dark: AccentModeConfig;
  }
> = {
  amber: {
    name: "Ámbar / Naranja",
    class: "bg-[#d97706]",
    light: {
      primary: "32 91% 44%",
      ring: "32 91% 44%",
      accent: "29 48% 48%",
      background: "34 44% 93%",
      foreground: "25 60% 16%",
      border: "34 15% 82%",
      card: "0 0% 99%",
      secondary: "34 32% 87%",
      muted: "34 25% 90%",
      mutedForeground: "21 11% 37%",
      sidebarBackground: "25 60% 16%",
      sidebarAccent: "27 61% 24%",
      sidebarBorder: "27 61% 20%",
      sidebarForeground: "34 44% 93%",
      sidebarFooter: "32 58% 22%",
    },
    dark: {
      primary: "32 91% 48%",
      ring: "32 91% 48%",
      accent: "29 48% 52%",
      background: "24 50% 5%",
      foreground: "34 44% 93%",
      border: "21 11% 18%",
      card: "25 45% 10%",
      secondary: "27 61% 16%",
      muted: "25 35% 12%",
      mutedForeground: "26 7% 65%",
      sidebarBackground: "300 7% 4%",
      sidebarAccent: "25 45% 10%",
      sidebarBorder: "21 11% 14%",
      sidebarForeground: "34 44% 93%",
      sidebarFooter: "32 36% 11%",
    },
  },
  emerald: {
    name: "Esmeralda",
    class: "bg-[#10b981]",
    light: {
      primary: "142 70% 36%",
      ring: "142 70% 36%",
      accent: "142 65% 28%",
      background: "140 30% 95%",
      foreground: "160 50% 12%",
      border: "140 15% 84%",
      card: "140 25% 99%",
      secondary: "140 22% 88%",
      muted: "140 18% 91%",
      mutedForeground: "160 12% 38%",
      sidebarBackground: "160 50% 12%",
      sidebarAccent: "160 40% 18%",
      sidebarBorder: "160 40% 14%",
      sidebarForeground: "140 30% 93%",
      sidebarFooter: "142 48% 18%",
    },
    dark: {
      primary: "142 65% 42%",
      ring: "142 65% 42%",
      accent: "142 55% 48%",
      background: "160 30% 6%",
      foreground: "140 30% 90%",
      border: "160 15% 18%",
      card: "160 35% 10%",
      secondary: "160 32% 14%",
      muted: "160 28% 12%",
      mutedForeground: "150 10% 65%",
      sidebarBackground: "160 35% 5%",
      sidebarAccent: "160 30% 12%",
      sidebarBorder: "160 30% 10%",
      sidebarForeground: "140 30% 90%",
      sidebarFooter: "142 32% 10%",
    },
  },
  rose: {
    name: "Rosado Premium",
    class: "bg-[#f43f5e]",
    light: {
      primary: "330 81% 52%",
      ring: "330 81% 52%",
      accent: "330 75% 44%",
      background: "330 30% 96%",
      foreground: "330 50% 14%",
      border: "330 15% 86%",
      card: "330 25% 99%",
      secondary: "330 22% 90%",
      muted: "330 18% 93%",
      mutedForeground: "330 12% 40%",
      sidebarBackground: "330 50% 13%",
      sidebarAccent: "330 40% 19%",
      sidebarBorder: "330 40% 15%",
      sidebarForeground: "330 30% 93%",
      sidebarFooter: "330 50% 20%",
    },
    dark: {
      primary: "330 80% 60%",
      ring: "330 80% 60%",
      accent: "330 70% 65%",
      background: "330 30% 6%",
      foreground: "330 30% 90%",
      border: "330 15% 18%",
      card: "330 40% 10%",
      secondary: "330 32% 14%",
      muted: "330 28% 12%",
      mutedForeground: "330 10% 65%",
      sidebarBackground: "330 35% 5%",
      sidebarAccent: "330 30% 12%",
      sidebarBorder: "330 30% 10%",
      sidebarForeground: "330 30% 90%",
      sidebarFooter: "330 32% 11%",
    },
  },
  blue: {
    name: "Azul Eléctrico",
    class: "bg-[#2563eb]",
    light: {
      primary: "217 91% 56%",
      ring: "217 91% 56%",
      accent: "217 80% 45%",
      background: "215 30% 95%",
      foreground: "222 47% 11%",
      border: "215 15% 84%",
      card: "215 25% 99%",
      secondary: "215 22% 88%",
      muted: "215 18% 91%",
      mutedForeground: "222 12% 38%",
      sidebarBackground: "222 47% 11%",
      sidebarAccent: "222 40% 18%",
      sidebarBorder: "222 40% 14%",
      sidebarForeground: "210 40% 93%",
      sidebarFooter: "217 52% 18%",
    },
    dark: {
      primary: "217 91% 60%",
      ring: "217 91% 60%",
      accent: "217 80% 65%",
      background: "222 40% 6%",
      foreground: "210 40% 90%",
      border: "222 15% 18%",
      card: "222 40% 10%",
      secondary: "222 32% 14%",
      muted: "222 28% 12%",
      mutedForeground: "215 10% 65%",
      sidebarBackground: "222 35% 5%",
      sidebarAccent: "222 30% 12%",
      sidebarBorder: "222 30% 10%",
      sidebarForeground: "210 40% 90%",
      sidebarFooter: "217 38% 11%",
    },
  },
};

/** Tokens CSS de un modo. Inline en <html> gana a :root / .dark. */
export function getAccentCssVars(
  mode: AccentModeConfig,
  isDark: boolean,
): Record<string, string> {
  const fg = mode.foreground;
  const sidebarAccentFg = isDark ? mode.sidebarForeground : PRIMARY_FOREGROUND;

  return {
    "--primary": mode.primary,
    "--primary-foreground": PRIMARY_FOREGROUND,
    "--ring": mode.ring,
    "--accent": mode.accent,
    "--accent-foreground": PRIMARY_FOREGROUND,
    "--background": mode.background,
    "--foreground": fg,
    "--card": mode.card,
    "--card-foreground": fg,
    "--popover": mode.card,
    "--popover-foreground": fg,
    "--secondary": mode.secondary,
    "--secondary-foreground": fg,
    "--muted": mode.muted,
    "--muted-foreground": mode.mutedForeground,
    "--border": mode.border,
    "--input": mode.border,
    "--sidebar-background": mode.sidebarBackground,
    "--sidebar-foreground": mode.sidebarForeground,
    "--sidebar-primary": mode.primary,
    "--sidebar-primary-foreground": PRIMARY_FOREGROUND,
    "--sidebar-accent": mode.sidebarAccent,
    "--sidebar-accent-foreground": sidebarAccentFg,
    "--sidebar-border": mode.sidebarBorder,
    "--sidebar-footer": mode.sidebarFooter,
    "--sidebar-ring": mode.primary,
    "--chart-1": mode.primary,
    "--chart-2": mode.accent,
  };
}

export const ACCENT_CSS_BY_MODE: Record<
  AccentColor,
  { light: Record<string, string>; dark: Record<string, string> }
> = {
  amber: {
    light: getAccentCssVars(ACCENT_COLORS.amber.light, false),
    dark: getAccentCssVars(ACCENT_COLORS.amber.dark, true),
  },
  emerald: {
    light: getAccentCssVars(ACCENT_COLORS.emerald.light, false),
    dark: getAccentCssVars(ACCENT_COLORS.emerald.dark, true),
  },
  rose: {
    light: getAccentCssVars(ACCENT_COLORS.rose.light, false),
    dark: getAccentCssVars(ACCENT_COLORS.rose.dark, true),
  },
  blue: {
    light: getAccentCssVars(ACCENT_COLORS.blue.light, false),
    dark: getAccentCssVars(ACCENT_COLORS.blue.dark, true),
  },
};

export function isAccentColor(value: unknown): value is AccentColor {
  return typeof value === "string" && value in ACCENT_COLORS;
}

function writeAccentVars(root: HTMLElement, vars: Record<string, string>): void {
  for (const [token, value] of Object.entries(vars)) {
    root.style.setProperty(token, value);
  }
}

/** Aplica variables CSS del acento (no muta flags de override). */
export function applyAccentColor(color: AccentColor, isDark?: boolean): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const config = ACCENT_COLORS[color] ?? ACCENT_COLORS.amber;
  const darkActive = isDark !== undefined ? isDark : root.classList.contains("dark");
  const modeConfig = darkActive ? config.dark : config.light;

  writeAccentVars(root, getAccentCssVars(modeConfig, darkActive));
  root.dataset.accent = color;

  try {
    localStorage.setItem(ACCENT_STORAGE_KEY, color);
  } catch {
    /* ignore */
  }

  window.dispatchEvent(new Event("brand-accent-changed"));
}

export function hasAccentOverride(): boolean {
  if (typeof window === "undefined") return false;
  try {
    migrateLegacyAccentOverride();
    return localStorage.getItem(ACCENT_OVERRIDE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Si había brand-accent sin flag, lo trata como preferencia personal. */
function migrateLegacyAccentOverride(): void {
  if (localStorage.getItem(ACCENT_OVERRIDE_KEY) !== null) return;
  const saved = localStorage.getItem(ACCENT_STORAGE_KEY);
  if (isAccentColor(saved)) {
    localStorage.setItem(ACCENT_OVERRIDE_KEY, "1");
  } else {
    localStorage.setItem(ACCENT_OVERRIDE_KEY, "0");
  }
}

export function resolveEffectiveAccent(platformDefault: AccentColor): AccentColor {
  if (typeof window === "undefined") return platformDefault;
  try {
    migrateLegacyAccentOverride();
    if (localStorage.getItem(ACCENT_OVERRIDE_KEY) === "1") {
      const saved = localStorage.getItem(ACCENT_STORAGE_KEY);
      if (isAccentColor(saved)) return saved;
    }
  } catch {
    /* ignore */
  }
  return isAccentColor(platformDefault) ? platformDefault : DEFAULT_ACCENT_COLOR;
}

/** Preferencia personal: deja de seguir el color de plataforma. */
export function setAccentOverride(color: AccentColor, isDark?: boolean): void {
  localStorage.setItem(ACCENT_OVERRIDE_KEY, "1");
  applyAccentColor(color, isDark);
}

/** Vuelve al color por defecto de la plataforma. */
export function clearAccentOverride(platformDefault: AccentColor, isDark?: boolean): void {
  localStorage.setItem(ACCENT_OVERRIDE_KEY, "0");
  applyAccentColor(platformDefault, isDark);
}
