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

/** Slug de categoría: minúsculas, números y guiones bajos (sin acentos ni guiones). */
export function normalizeCategorySlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
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

  const colors: Record<string, string> = {
    conferences: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/60",
    education: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60",
    business: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
    music: "bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200 dark:border-pink-900/60",
    sports: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60",
    religion: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200 dark:border-violet-900/60",
    arts: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900/60",
    community: "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-900/60",
    government: "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200 border-slate-200 dark:border-slate-700",
    charity: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/60",
    tradeshows: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-900/60",
    technology: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900/60",
    celebrations: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
    travel: "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-900/60",
    health: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60",
    corporate: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/60",
    family: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900/60",
    other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    // Slugs legados
    worship: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
    retreat: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    youth: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    conference: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    prayer: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    bible_study: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
    outreach: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    fellowship: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  };

  return colors[normalized] ?? colors.other;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-900 border border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-850/30",
    published: "bg-green-100 text-green-900 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30",
    cancelled: "bg-red-100 text-red-900 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30",
    completed: "bg-blue-100 text-blue-900 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/30",
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

/** Muestra solo los 9 dígitos locales en inputs con prefijo +51 fijo. */
export function formatPeruPhoneInput(value?: string | null): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("51") && digits.length === 11) {
    return digits.slice(2);
  }
  if (digits.length === 9) {
    return digits;
  }
  return digits.slice(-9);
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
