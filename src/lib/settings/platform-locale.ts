import type { Locale } from "@/lib/i18n/core";
import { resolveLocale } from "@/lib/i18n/core";

export const DEFAULT_PLATFORM_TIMEZONE = "America/Lima";
export const DEFAULT_PLATFORM_LOCALE: Locale = "es";

export type PlatformTimezoneOption = {
  value: string;
  labelEs: string;
  labelEn: string;
  countryCode: string;
};

/** Zonas horarias habituales para la plataforma (Perú prioritario, LatAm, EE. UU., Europa y UTC). */
export const PLATFORM_TIMEZONE_OPTIONS: PlatformTimezoneOption[] = [
  { value: "America/Lima", labelEs: "Lima (Perú)", labelEn: "Lima (Peru)", countryCode: "PE" },
  { value: "America/Bogota", labelEs: "Bogotá (Colombia)", labelEn: "Bogota (Colombia)", countryCode: "CO" },
  { value: "America/Guayaquil", labelEs: "Guayaquil (Ecuador)", labelEn: "Guayaquil (Ecuador)", countryCode: "EC" },
  { value: "America/La_Paz", labelEs: "La Paz (Bolivia)", labelEn: "La Paz (Bolivia)", countryCode: "BO" },
  { value: "America/Santiago", labelEs: "Santiago (Chile)", labelEn: "Santiago (Chile)", countryCode: "CL" },
  {
    value: "America/Argentina/Buenos_Aires",
    labelEs: "Buenos Aires (Argentina)",
    labelEn: "Buenos Aires (Argentina)",
    countryCode: "AR",
  },
  { value: "America/Sao_Paulo", labelEs: "São Paulo (Brasil)", labelEn: "Sao Paulo (Brazil)", countryCode: "BR" },
  { value: "America/Caracas", labelEs: "Caracas (Venezuela)", labelEn: "Caracas (Venezuela)", countryCode: "VE" },
  { value: "America/Montevideo", labelEs: "Montevideo (Uruguay)", labelEn: "Montevideo (Uruguay)", countryCode: "UY" },
  { value: "America/Asuncion", labelEs: "Asunción (Paraguay)", labelEn: "Asuncion (Paraguay)", countryCode: "PY" },
  { value: "America/Mexico_City", labelEs: "Ciudad de México", labelEn: "Mexico City", countryCode: "MX" },
  { value: "America/Panama", labelEs: "Panamá", labelEn: "Panama", countryCode: "PA" },
  { value: "America/Costa_Rica", labelEs: "San José (Costa Rica)", labelEn: "San Jose (Costa Rica)", countryCode: "CR" },
  { value: "America/New_York", labelEs: "Nueva York (EST/EDT)", labelEn: "New York (EST/EDT)", countryCode: "US" },
  { value: "America/Los_Angeles", labelEs: "Los Ángeles (PST/PDT)", labelEn: "Los Angeles (PST/PDT)", countryCode: "US" },
  { value: "Europe/Madrid", labelEs: "Madrid (España)", labelEn: "Madrid (Spain)", countryCode: "ES" },
  { value: "UTC", labelEs: "UTC (Tiempo Universal Coordinado)", labelEn: "UTC (Coordinated Universal Time)", countryCode: "UTC" },
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

/** Obtiene la etiqueta de desfase horario actual (ej. "GMT-5", "GMT+2"). */
export function getTimezoneOffsetLabel(timeZone: string): string {
  try {
    const tz = normalizePlatformTimezone(timeZone);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const offset = parts.find((p) => p.type === "timeZoneName")?.value;
    return offset || "GMT";
  } catch {
    return "GMT";
  }
}

/** Etiqueta completa para selectores de zona horaria con offset. */
export function getTimezoneDisplayLabel(
  option: PlatformTimezoneOption,
  locale: Locale = "es",
): string {
  const base = locale === "en" ? option.labelEn : option.labelEs;
  const offset = getTimezoneOffsetLabel(option.value);
  return `${base} — ${offset}`;
}

/** Formatea fecha/hora en la zona de la plataforma con soporte completo para Intl. */
export function formatDateTimeInTimezone(
  date: Date | string | number,
  options?: {
    timeZone?: string | null;
    locale?: Locale | string | null;
    dateStyle?: Intl.DateTimeFormatOptions["dateStyle"];
    timeStyle?: Intl.DateTimeFormatOptions["timeStyle"];
    hour12?: boolean;
    weekday?: Intl.DateTimeFormatOptions["weekday"];
    year?: Intl.DateTimeFormatOptions["year"];
    month?: Intl.DateTimeFormatOptions["month"];
    day?: Intl.DateTimeFormatOptions["day"];
    hour?: Intl.DateTimeFormatOptions["hour"];
    minute?: Intl.DateTimeFormatOptions["minute"];
    second?: Intl.DateTimeFormatOptions["second"];
  },
): string {
  const tz = normalizePlatformTimezone(options?.timeZone ?? DEFAULT_PLATFORM_TIMEZONE);
  const intlLocale =
    options?.locale === "en" || String(options?.locale).startsWith("en") ? "en-US" : "es-PE";

  try {
    const formatOptions: Intl.DateTimeFormatOptions = {
      timeZone: tz,
    };

    if (options?.dateStyle) formatOptions.dateStyle = options.dateStyle;
    if (options?.timeStyle) formatOptions.timeStyle = options.timeStyle;
    if (options?.hour12 !== undefined) formatOptions.hour12 = options.hour12;
    if (options?.weekday) formatOptions.weekday = options.weekday;
    if (options?.year) formatOptions.year = options.year;
    if (options?.month) formatOptions.month = options.month;
    if (options?.day) formatOptions.day = options.day;
    if (options?.hour) formatOptions.hour = options.hour;
    if (options?.minute) formatOptions.minute = options.minute;
    if (options?.second) formatOptions.second = options.second;

    // Si no se especificó ni dateStyle ni componentes individuales, usar defaults legibles
    if (!options?.dateStyle && !options?.timeStyle && !options?.year && !options?.hour) {
      formatOptions.dateStyle = "medium";
      formatOptions.timeStyle = "short";
    }

    return new Intl.DateTimeFormat(intlLocale, formatOptions).format(new Date(date));
  } catch {
    return new Date(date).toLocaleString(intlLocale);
  }
}
