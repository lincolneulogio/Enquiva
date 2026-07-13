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
  /** Usar credenciales SMTP de BD en lugar de .env. */
  smtpUseCustom: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFromEmail: string;
  smtpFromName: string;
  /** True si hay contraseña cifrada guardada (nunca se expone el valor). */
  smtpPasswordSet: boolean;
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
  smtpUseCustom: false,
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpFromEmail: "",
  smtpFromName: "",
  smtpPasswordSet: false,
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
    smtpUseCustom: Boolean(row.smtpUseCustom),
    smtpHost: row.smtpHost ?? "",
    smtpPort: Number(row.smtpPort) > 0 ? Number(row.smtpPort) : 587,
    smtpUser: row.smtpUser ?? "",
    smtpFromEmail: row.smtpFromEmail ?? "",
    smtpFromName: row.smtpFromName ?? "",
    smtpPasswordSet: Boolean(row.smtpPassEncrypted?.trim()),
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
  // Nunca aceptar smtpPasswordSet desde el cliente (es derivado).
  delete (next as { smtpPasswordSet?: boolean }).smtpPasswordSet;

  if (typeof next.smtpHost === "string") next.smtpHost = next.smtpHost.trim();
  if (typeof next.smtpUser === "string") next.smtpUser = next.smtpUser.trim();
  if (typeof next.smtpFromEmail === "string") next.smtpFromEmail = next.smtpFromEmail.trim();
  if (typeof next.smtpFromName === "string") next.smtpFromName = next.smtpFromName.trim();
  if (typeof next.smtpPort === "number") {
    next.smtpPort = Number.isFinite(next.smtpPort) && next.smtpPort > 0 ? Math.round(next.smtpPort) : 587;
  }

  return next;
}

function toDbRow(
  settings: SystemSettings,
  smtpPassEncrypted: string,
): Omit<typeof platformSettings.$inferInsert, "id" | "updatedAt" | "updatedBy"> {
  return {
    organizationName: settings.organizationName,
    supportEmail: settings.supportEmail,
    publicContactEmail: settings.publicContactEmail,
    publicLocation: settings.publicLocation,
    socialFacebook: settings.socialFacebook,
    socialInstagram: settings.socialInstagram,
    socialX: settings.socialX,
    socialLinkedIn: settings.socialLinkedIn,
    socialWhatsApp: settings.socialWhatsApp,
    socialYoutube: settings.socialYoutube,
    defaultAccentColor: settings.defaultAccentColor,
    maintenanceMode: settings.maintenanceMode,
    maintenanceMessage: settings.maintenanceMessage,
    announcementEnabled: settings.announcementEnabled,
    announcementMessage: settings.announcementMessage,
    announcementSeverity: settings.announcementSeverity,
    announcementDismissible: settings.announcementDismissible,
    termsUrl: settings.termsUrl,
    privacyUrl: settings.privacyUrl,
    defaultLocale: settings.defaultLocale,
    defaultTimezone: settings.defaultTimezone,
    smtpUseCustom: settings.smtpUseCustom,
    smtpHost: settings.smtpHost,
    smtpPort: settings.smtpPort,
    smtpUser: settings.smtpUser,
    smtpPassEncrypted,
    smtpFromEmail: settings.smtpFromEmail,
    smtpFromName: settings.smtpFromName,
    alertNewPayments: settings.alertNewPayments,
    alertTransportCapacity: settings.alertTransportCapacity,
    alertDailyFinanceSummary: settings.alertDailyFinanceSummary,
  };
}

async function readSmtpPassEncrypted(): Promise<string> {
  const [row] = await db
    .select({ smtpPassEncrypted: platformSettings.smtpPassEncrypted })
    .from(platformSettings)
    .where(eq(platformSettings.id, SETTINGS_ROW_ID))
    .limit(1);
  return row?.smtpPassEncrypted ?? "";
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
      ...toDbRow(initial, ""),
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
  // Mantener flag derivado coherente
  const passEncrypted = await readSmtpPassEncrypted();
  updated.smtpPasswordSet = Boolean(passEncrypted.trim());

  const dbValues = toDbRow(updated, passEncrypted);

  await db
    .insert(platformSettings)
    .values({
      id: SETTINGS_ROW_ID,
      ...dbValues,
      updatedBy: actor?.id ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: platformSettings.id,
      set: {
        ...dbValues,
        updatedBy: actor?.id ?? null,
        updatedAt: new Date(),
      },
    });

  invalidatePlatformOpsCache();
  return updated;
}

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

/** Guarda credenciales SMTP (contraseña cifrada). */
export async function saveSmtpSettings(
  input: SmtpSettingsInput,
  actor?: { id: string; name: string },
): Promise<SystemSettings> {
  const { encryptSecret } = await import("@/lib/crypto/secret");
  const current = await getSystemSettings();
  let passEncrypted = await readSmtpPassEncrypted();

  const password = input.smtpPassword?.trim() ?? "";
  if (password) {
    passEncrypted = encryptSecret(password);
  }

  if (input.smtpUseCustom) {
    if (!input.smtpHost.trim()) {
      throw new Error("El host SMTP es obligatorio cuando usas credenciales personalizadas.");
    }
    if (!input.smtpUser.trim()) {
      throw new Error("El usuario SMTP es obligatorio cuando usas credenciales personalizadas.");
    }
    if (!passEncrypted.trim()) {
      throw new Error("Debes indicar la contraseña SMTP al activar credenciales personalizadas.");
    }
    const fromEmail = input.smtpFromEmail.trim();
    if (fromEmail && !fromEmail.includes("@")) {
      throw new Error("El correo remitente no es válido.");
    }
  }

  const updated: SystemSettings = {
    ...current,
    smtpUseCustom: Boolean(input.smtpUseCustom),
    smtpHost: input.smtpHost.trim(),
    smtpPort:
      Number.isFinite(input.smtpPort) && input.smtpPort > 0
        ? Math.round(input.smtpPort)
        : 587,
    smtpUser: input.smtpUser.trim(),
    smtpFromEmail: input.smtpFromEmail.trim(),
    smtpFromName: input.smtpFromName.trim(),
    smtpPasswordSet: Boolean(passEncrypted.trim()),
  };

  const dbValues = toDbRow(updated, passEncrypted);

  await db
    .insert(platformSettings)
    .values({
      id: SETTINGS_ROW_ID,
      ...dbValues,
      updatedBy: actor?.id ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: platformSettings.id,
      set: {
        ...dbValues,
        updatedBy: actor?.id ?? null,
        updatedAt: new Date(),
      },
    });

  invalidatePlatformOpsCache();
  const { invalidateMailTransporterCache } = await import("@/lib/mail/transporter");
  invalidateMailTransporterCache();

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
