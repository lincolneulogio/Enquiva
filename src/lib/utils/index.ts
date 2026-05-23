import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isAfter } from "date-fns";
import { enUS, es } from "date-fns/locale";
import {
  defaultLocale,
  getCategoryLabel,
  getEventStatusLabel,
  getIntlLocale,
  getRegistrationStatusLabel,
  type Locale,
} from "@/lib/i18n/core";

const DATE_LOCALES = {
  es,
  en: enUS,
} as const;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateUniqueSlug(title: string): string {
  const base = slugify(title);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

export function formatEventDate(date: Date | string, locale: Locale = defaultLocale): string {
  return format(
    new Date(date),
    locale === "en"
      ? "EEEE, MMMM d, yyyy 'at' h:mm a"
      : "EEEE d 'de' MMMM 'de' yyyy 'a las' h:mm a",
    { locale: DATE_LOCALES[locale] }
  );
}

export function formatEventDateShort(date: Date | string, locale: Locale = defaultLocale): string {
  return format(new Date(date), locale === "en" ? "MMM d, yyyy" : "d MMM yyyy", {
    locale: DATE_LOCALES[locale],
  });
}

export function formatRelativeTime(date: Date | string, locale: Locale = defaultLocale): string {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: DATE_LOCALES[locale],
  });
}

export function isEventUpcoming(date: Date | string): boolean {
  return isAfter(new Date(date), new Date());
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

export function categoryLabel(category: string, locale: Locale = defaultLocale): string {
  return getCategoryLabel(category, locale);
}

export function categoryColor(category: string): string {
  if (!category) return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  
  // Normalize the category text (lower case, replace spaces/dashes, remove accents)
  const normalized = category
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const keyMap: Record<string, string> = {
    estudio_biblico: "bible_study",
    bible_study: "bible_study",
    adoracion: "worship",
    worship: "worship",
    retiro: "retreat",
    retreat: "retreat",
    juventud: "youth",
    youth: "youth",
    caridad: "charity",
    charity: "charity",
    conferencia: "conference",
    conference: "conference",
    oracion: "prayer",
    prayer: "prayer",
    alcance_comunitario: "outreach",
    outreach: "outreach",
    comunidad: "fellowship",
    fellowship: "fellowship",
  };

  const canonicalKey = keyMap[normalized] || normalized;

  const colors: Record<string, string> = {
    worship: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
    retreat: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    youth: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    charity: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    conference: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    prayer: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    bible_study: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
    outreach: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    fellowship: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  };
  return colors[canonicalKey] ?? colors.other;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    published: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
  };
  return colors[status] ?? colors.draft;
}

export function eventStatusLabel(status: string, locale: Locale = defaultLocale): string {
  return getEventStatusLabel(status, locale);
}

export function registrationStatusLabel(status: string, locale: Locale = defaultLocale): string {
  return getRegistrationStatusLabel(status, locale);
}

export function generateTicketCode(): string {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TKT-${suffix}`;
}

export function normalizePeruPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("51") && digits.length === 11) {
    return `+${digits}`;
  }
  if (digits.length === 9) {
    return `+51${digits}`;
  }
  return value.trim();
}

export function isPeruPhoneNineDigits(value: string): boolean {
  return /^\d{9}$/.test(value.replace(/\D/g, ""));
}

export function formatCurrency(
  value: number,
  currency = "USD",
  locale: Locale = defaultLocale
): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency,
  }).format(value);
}
