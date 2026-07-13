import type { Locale } from "@/lib/i18n/core";
import { resolveLocale } from "@/lib/i18n/core";

export const DEFAULT_PLATFORM_TIMEZONE = "America/Lima";

export type PlatformTimezoneOption = {
  value: string;
  labelEs: string;
  labelEn: string;
};

/** Zonas horarias habituales para la plataforma (LatAm + comunes). */
export const PLATFORM_TIMEZONE_OPTIONS: PlatformTimezoneOption[] = [
  { value: "America/Lima", labelEs: "Lima (Perú)", labelEn: "Lima (Peru)" },
  { value: "America/Bogota", labelEs: "Bogotá (Colombia)", labelEn: "Bogotá (Colombia)" },
  { value: "America/Guayaquil", labelEs: "Guayaquil (Ecuador)", labelEn: "Guayaquil (Ecuador)" },
  { value: "America/La_Paz", labelEs: "La Paz (Bolivia)", labelEn: "La Paz (Bolivia)" },
  { value: "America/Santiago", labelEs: "Santiago (Chile)", labelEn: "Santiago (Chile)" },
  {
    value: "America/Argentina/Buenos_Aires",
    labelEs: "Buenos Aires (Argentina)",
    labelEn: "Buenos Aires (Argentina)",
  },
  { value: "America/Sao_Paulo", labelEs: "São Paulo (Brasil)", labelEn: "São Paulo (Brazil)" },
  { value: "America/Mexico_City", labelEs: "Ciudad de México", labelEn: "Mexico City" },
  { value: "America/New_York", labelEs: "Nueva York (EST)", labelEn: "New York (EST)" },
  { value: "America/Los_Angeles", labelEs: "Los Ángeles (PST)", labelEn: "Los Angeles (PST)" },
  { value: "Europe/Madrid", labelEs: "Madrid (España)", labelEn: "Madrid (Spain)" },
  { value: "UTC", labelEs: "UTC", labelEn: "UTC" },
];

export function isValidIanaTimezone(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value.trim() });
    return true;
  } catch {
    return false;
  }
}

export function normalizePlatformTimezone(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_PLATFORM_TIMEZONE;
  const tz = value.trim();
  if (!tz || !isValidIanaTimezone(tz)) return DEFAULT_PLATFORM_TIMEZONE;
  return tz;
}

export function normalizePlatformLocale(value: unknown): Locale {
  return resolveLocale(typeof value === "string" ? value : undefined);
}

/** Formatea fecha/hora en la zona de la plataforma. */
export function formatDateTimeInTimezone(
  date: Date | string | number,
  options: {
    timeZone: string;
    locale?: Locale | string;
    dateStyle?: Intl.DateTimeFormatOptions["dateStyle"];
    timeStyle?: Intl.DateTimeFormatOptions["timeStyle"];
  },
): string {
  const tz = normalizePlatformTimezone(options.timeZone);
  const intlLocale =
    options.locale === "en" || String(options.locale).startsWith("en") ? "en-US" : "es-PE";
  try {
    return new Intl.DateTimeFormat(intlLocale, {
      timeZone: tz,
      dateStyle: options.dateStyle ?? "medium",
      timeStyle: options.timeStyle ?? "short",
    }).format(new Date(date));
  } catch {
    return new Date(date).toLocaleString(intlLocale);
  }
}
