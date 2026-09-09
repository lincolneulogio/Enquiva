import { BRAND } from "@/lib/brand";
import { DEFAULT_ACCENT_COLOR, type AccentColor } from "@/lib/brand/accent";
import { DEFAULT_PLATFORM_TIMEZONE } from "@/lib/settings/platform-locale";
import type { Locale } from "@/lib/i18n/core";
import type { AnnouncementSeverity, PlatformOpsStatus } from "@/lib/settings/platform-ops";

export type { AnnouncementSeverity, PlatformOpsStatus };

export function normalizeOptionalIsoDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export interface SystemSettings {
  organizationName: string;
  supportEmail: string;
  publicContactEmail: string;
  publicLocation: string;
  socialFacebook: string;
  socialInstagram: string;
  socialX: string;
  socialLinkedIn: string;
  socialWhatsApp: string;
  socialYoutube: string;
  /** Color de acento por defecto de toda la plataforma. */
  defaultAccentColor: AccentColor;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  /** ISO o null — programación de mantenimiento. */
  maintenanceStartsAt: string | null;
  maintenanceEndsAt: string | null;
  announcementEnabled: boolean;
  announcementMessage: string;
  announcementSeverity: AnnouncementSeverity;
  announcementDismissible: boolean;
  announcementStartsAt: string | null;
  announcementEndsAt: string | null;
  announcementEventAt: string | null;
  /** Banner superior dinámico de eventos */
  eventBannerEnabled: boolean;
  eventBannerMode: "auto" | "pinned";
  eventBannerCriteria: "auto" | "upcoming" | "popular" | "few_tickets";
  eventBannerPinnedEventId: string | null;
  eventBannerCustomBadge: string;
  eventBannerCustomText: string;
  /** URL o ruta de términos de servicio. */
  termsUrl: string;
  /** URL o ruta de política de privacidad. */
  privacyUrl: string;
  /** Idioma por defecto (es|en) sin cookie de usuario. */
  defaultLocale: Locale;
  /** Zona horaria IANA por defecto. */
  defaultTimezone: string;
  /** Usar credenciales SMTP de BD en lugar de .env. */
  smtpUseCustom: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFromEmail: string;
  smtpFromName: string;
  /** True si hay contraseña cifrada guardada (nunca se expone el valor). */
  smtpPasswordSet: boolean;
  /**
   * Título de marca en notificaciones push (máx. 64).
   * Vacío = nombre de organización / marca.
   */
  pushNotificationTitle: string;
  alertNewPayments: boolean;
  alertNewRegistrations: boolean;
  alertTransportCapacity: boolean;
  alertOrganizerRequests: boolean;
  alertEventPublished: boolean;
  alertSubscriptionPastDue: boolean;
  alertDailyFinanceSummary: boolean;
  /** Tarjetas y métricas de impacto en portada */
  impactCard1Title: string;
  impactCard1Subtitle: string;
  impactCard1ImageUrl: string;
  impactCard2Title: string;
  impactCard2Subtitle: string;
  impactCard2ImageUrl: string;
  impactSatisfactionRate: string;
  /** URL del sello oficial para certificados (Enquiva Verified). */
  certificateSealUrl: string;
}

export const SETTINGS_ROW_ID = "default";

export const DEFAULT_SETTINGS: SystemSettings = {
  organizationName: BRAND.name,
  supportEmail: BRAND.supportEmail,
  publicContactEmail: BRAND.contactEmail,
  publicLocation: "Huánuco, Perú",
  socialFacebook: "https://www.facebook.com/lincolneulogio",
  socialInstagram: "",
  socialX: "",
  socialLinkedIn: "",
  socialWhatsApp: "",
  socialYoutube: "",
  defaultAccentColor: DEFAULT_ACCENT_COLOR,
  maintenanceMode: false,
  maintenanceMessage: "",
  maintenanceStartsAt: null,
  maintenanceEndsAt: null,
  announcementEnabled: false,
  announcementMessage: "",
  announcementSeverity: "info",
  announcementDismissible: true,
  announcementStartsAt: null,
  announcementEndsAt: null,
  announcementEventAt: null,
  eventBannerEnabled: false,
  eventBannerMode: "auto",
  eventBannerCriteria: "auto",
  eventBannerPinnedEventId: null,
  eventBannerCustomBadge: "",
  eventBannerCustomText: "",
  termsUrl: "",
  privacyUrl: "",
  defaultLocale: "es",
  defaultTimezone: DEFAULT_PLATFORM_TIMEZONE,
  smtpUseCustom: false,
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpFromEmail: "",
  smtpFromName: "",
  smtpPasswordSet: false,
  pushNotificationTitle: "",
  alertNewPayments: true,
  alertNewRegistrations: true,
  alertTransportCapacity: true,
  alertOrganizerRequests: true,
  alertEventPublished: true,
  alertSubscriptionPastDue: true,
  alertDailyFinanceSummary: false,
  impactCard1Title: "5+ años impulsando",
  impactCard1Subtitle: "Eventos de tecnología, negocios e innovación en Huánuco y todo el Perú.",
  impactCard1ImageUrl: "",
  impactCard2Title: "Más de 250 empresas",
  impactCard2Subtitle: "Ya patrocinan y reclutan talento activamente en nuestros eventos.",
  impactCard2ImageUrl: "",
  impactSatisfactionRate: "99.8%",
  certificateSealUrl: "/images/enquiva-verified-seal.png",
};

export type SmtpSettingsInput = {
  smtpUseCustom: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFromEmail: string;
  smtpFromName: string;
  /** Vacío = conservar la contraseña actual. */
  smtpPassword?: string;
};

export function describeSettingsChanges(
  before: SystemSettings,
  after: SystemSettings,
): string {
  const changes: string[] = [];
  for (const key of Object.keys(before) as (keyof SystemSettings)[]) {
    if (before[key] !== after[key]) {
      changes.push(`${key}: ${String(before[key])} → ${String(after[key])}`);
    }
  }
  return changes.length > 0 ? changes.join("; ") : "sin cambios detectados";
}
