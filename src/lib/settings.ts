import fs from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { platformSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { BRAND } from "@/lib/brand";
import { normalizeHttpUrl, normalizeLegalUrl, normalizeWhatsAppLink } from "@/lib/brand/social";
import {
  DEFAULT_ACCENT_COLOR,
  isAccentColor,
  type AccentColor,
} from "@/lib/brand/accent";
import {
  invalidatePlatformOpsCache,
  isAnnouncementSeverity,
  opsStatusFromSettings,
  type AnnouncementSeverity,
  type PlatformOpsStatus,
} from "@/lib/settings/platform-ops";
import {
  DEFAULT_PLATFORM_TIMEZONE,
  normalizePlatformLocale,
  normalizePlatformTimezone,
} from "@/lib/settings/platform-locale";
import type { Locale } from "@/lib/i18n/core";

export type { AnnouncementSeverity, PlatformOpsStatus };

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
  announcementEnabled: boolean;
  announcementMessage: string;
  announcementSeverity: AnnouncementSeverity;
  announcementDismissible: boolean;
  /** URL o ruta de términos de servicio. */
  termsUrl: string;
  /** URL o ruta de política de privacidad. */
  privacyUrl: string;
  /** Idioma por defecto (es|en) sin cookie de usuario. */
  defaultLocale: Locale;
  /** Zona horaria IANA por defecto. */
  defaultTimezone: string;
  alertNewPayments: boolean;
  alertTransportCapacity: boolean;
  alertDailyFinanceSummary: boolean;
}

const SETTINGS_ROW_ID = "default";

const LEGACY_SETTINGS_FILE_PATH = path.join(process.cwd(), "src/lib/db/system-settings.json");

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
  announcementEnabled: false,
  announcementMessage: "",
  announcementSeverity: "info",
  announcementDismissible: true,
  termsUrl: "",
  privacyUrl: "",
  defaultLocale: "es",
  defaultTimezone: DEFAULT_PLATFORM_TIMEZONE,
  alertNewPayments: true,
  alertTransportCapacity: true,
  alertDailyFinanceSummary: false,
};

function rowToSettings(row: typeof platformSettings.$inferSelect): SystemSettings {
  const accent = row.defaultAccentColor;
  return {
    organizationName: row.organizationName,
    supportEmail: row.supportEmail,
    publicContactEmail: row.publicContactEmail || DEFAULT_SETTINGS.publicContactEmail,
    publicLocation: row.publicLocation ?? "",
    socialFacebook: row.socialFacebook ?? "",
    socialInstagram: row.socialInstagram ?? "",
    socialX: row.socialX ?? "",
    socialLinkedIn: row.socialLinkedIn ?? "",
    socialWhatsApp: row.socialWhatsApp ?? "",
    socialYoutube: row.socialYoutube ?? "",
    defaultAccentColor: isAccentColor(accent) ? accent : DEFAULT_ACCENT_COLOR,
    maintenanceMode: Boolean(row.maintenanceMode),
    maintenanceMessage: row.maintenanceMessage ?? "",
    announcementEnabled: Boolean(row.announcementEnabled),
    announcementMessage: row.announcementMessage ?? "",
    announcementSeverity: isAnnouncementSeverity(row.announcementSeverity)
      ? row.announcementSeverity
      : "info",
    announcementDismissible: row.announcementDismissible !== false,
    termsUrl: row.termsUrl ?? "",
    privacyUrl: row.privacyUrl ?? "",
    defaultLocale: normalizePlatformLocale(row.defaultLocale),
    defaultTimezone: normalizePlatformTimezone(row.defaultTimezone),
    alertNewPayments: row.alertNewPayments,
    alertTransportCapacity: row.alertTransportCapacity,
    alertDailyFinanceSummary: row.alertDailyFinanceSummary,
  };
}

function sanitizeSettingsPatch(settings: Partial<SystemSettings>): Partial<SystemSettings> {
  const next: Partial<SystemSettings> = { ...settings };

  if (typeof next.publicContactEmail === "string") {
    next.publicContactEmail = next.publicContactEmail.trim();
  }
  if (typeof next.supportEmail === "string") {
    next.supportEmail = next.supportEmail.trim();
  }
  if (typeof next.organizationName === "string") {
    next.organizationName = next.organizationName.trim();
  }
  if (typeof next.publicLocation === "string") {
    next.publicLocation = next.publicLocation.trim();
  }
  if (typeof next.socialFacebook === "string") {
    next.socialFacebook = normalizeHttpUrl(next.socialFacebook);
  }
  if (typeof next.socialInstagram === "string") {
    next.socialInstagram = normalizeHttpUrl(next.socialInstagram);
  }
  if (typeof next.socialX === "string") {
    next.socialX = normalizeHttpUrl(next.socialX);
  }
  if (typeof next.socialLinkedIn === "string") {
    next.socialLinkedIn = normalizeHttpUrl(next.socialLinkedIn);
  }
  if (typeof next.socialYoutube === "string") {
    next.socialYoutube = normalizeHttpUrl(next.socialYoutube);
  }
  if (typeof next.socialWhatsApp === "string") {
    next.socialWhatsApp = normalizeWhatsAppLink(next.socialWhatsApp);
  }
  if (typeof next.defaultAccentColor === "string") {
    next.defaultAccentColor = isAccentColor(next.defaultAccentColor)
      ? next.defaultAccentColor
      : DEFAULT_ACCENT_COLOR;
  }
  if (typeof next.maintenanceMessage === "string") {
    next.maintenanceMessage = next.maintenanceMessage.trim().slice(0, 500);
  }
  if (typeof next.announcementMessage === "string") {
    next.announcementMessage = next.announcementMessage.trim().slice(0, 400);
  }
  if (typeof next.announcementSeverity === "string") {
    next.announcementSeverity = isAnnouncementSeverity(next.announcementSeverity)
      ? next.announcementSeverity
      : "info";
  }
  if (typeof next.maintenanceMode === "boolean") {
    next.maintenanceMode = next.maintenanceMode;
  }
  if (typeof next.announcementEnabled === "boolean") {
    next.announcementEnabled = next.announcementEnabled;
  }
  if (typeof next.announcementDismissible === "boolean") {
    next.announcementDismissible = next.announcementDismissible;
  }
  if (typeof next.termsUrl === "string") {
    next.termsUrl = normalizeLegalUrl(next.termsUrl);
  }
  if (typeof next.privacyUrl === "string") {
    next.privacyUrl = normalizeLegalUrl(next.privacyUrl);
  }
  if (typeof next.defaultLocale === "string") {
    next.defaultLocale = normalizePlatformLocale(next.defaultLocale);
  }
  if (typeof next.defaultTimezone === "string") {
    next.defaultTimezone = normalizePlatformTimezone(next.defaultTimezone);
  }

  return next;
}

async function readLegacyJsonSettings(): Promise<SystemSettings | null> {
  try {
    const fileContent = await fs.readFile(LEGACY_SETTINGS_FILE_PATH, "utf-8");
    return { ...DEFAULT_SETTINGS, ...JSON.parse(fileContent) };
  } catch {
    return null;
  }
}

async function ensureSettingsRow(): Promise<SystemSettings> {
  const [existing] = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.id, SETTINGS_ROW_ID))
    .limit(1);

  if (existing) {
    return rowToSettings(existing);
  }

  const legacy = await readLegacyJsonSettings();
  const initial = legacy ?? DEFAULT_SETTINGS;

  await db
    .insert(platformSettings)
    .values({
      id: SETTINGS_ROW_ID,
      ...initial,
    })
    .onConflictDoNothing();

  const [row] = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.id, SETTINGS_ROW_ID))
    .limit(1);

  return row ? rowToSettings(row) : initial;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    return await ensureSettingsRow();
  } catch (error) {
    console.error("[settings] Failed to load from database, using defaults:", error);
    const legacy = await readLegacyJsonSettings();
    return legacy ?? DEFAULT_SETTINGS;
  }
}

export async function getPlatformOpsStatus(): Promise<PlatformOpsStatus> {
  const settings = await getSystemSettings();
  return opsStatusFromSettings(settings);
}

export async function saveSystemSettings(
  settings: Partial<SystemSettings>,
  actor?: { id: string; name: string },
): Promise<SystemSettings> {
  const current = await getSystemSettings();
  const updated: SystemSettings = {
    ...current,
    ...sanitizeSettingsPatch(settings),
  };

  await db
    .insert(platformSettings)
    .values({
      id: SETTINGS_ROW_ID,
      ...updated,
      updatedBy: actor?.id ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: platformSettings.id,
      set: {
        ...updated,
        updatedBy: actor?.id ?? null,
        updatedAt: new Date(),
      },
    });

  invalidatePlatformOpsCache();
  return updated;
}

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
