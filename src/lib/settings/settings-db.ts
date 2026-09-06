import fs from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { platformSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  invalidatePlatformOpsCache,
  opsStatusFromSettings,
  type PlatformOpsStatus,
} from "@/lib/settings/platform-ops";
import { CACHE_KEYS, CACHE_TTL, getCached, invalidateCache, invalidateCachePattern, setCached } from "@/lib/redis";
import {
  DEFAULT_SETTINGS,
  SETTINGS_ROW_ID,
  type SmtpSettingsInput,
  type SystemSettings,
} from "./settings-types";
import {
  rowToSettings,
  sanitizeSettingsPatch,
  toDbRow,
} from "./settings-sanitize";

const LEGACY_SETTINGS_FILE_PATH = path.join(process.cwd(), "src/lib/db/system-settings.json");

export async function readSmtpPassEncrypted(): Promise<string> {
  const [row] = await db
    .select({ smtpPassEncrypted: platformSettings.smtpPassEncrypted })
    .from(platformSettings)
    .where(eq(platformSettings.id, SETTINGS_ROW_ID))
    .limit(1);
  return row?.smtpPassEncrypted ?? "";
}

export async function readLegacyJsonSettings(): Promise<SystemSettings | null> {
  try {
    const fileContent = await fs.readFile(LEGACY_SETTINGS_FILE_PATH, "utf-8");
    return { ...DEFAULT_SETTINGS, ...JSON.parse(fileContent) };
  } catch {
    return null;
  }
}

export async function ensureSettingsRow(): Promise<SystemSettings> {
  const [existing] = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.id, SETTINGS_ROW_ID))
    .limit(1);

  if (existing) return rowToSettings(existing);

  const legacy = await readLegacyJsonSettings();
  const initial = legacy ?? DEFAULT_SETTINGS;

  await db
    .insert(platformSettings)
    .values({ id: SETTINGS_ROW_ID, ...toDbRow(initial, "") })
    .onConflictDoNothing();

  const [row] = await db
    .select()
    .from(platformSettings)
    .where(eq(platformSettings.id, SETTINGS_ROW_ID))
    .limit(1);

  return row ? rowToSettings(row) : initial;
}

export async function invalidateSystemSettingsCache(): Promise<void> {
  invalidatePlatformOpsCache();
  await invalidateCache(CACHE_KEYS.platformSettings);
  await invalidateCachePattern("events:spotlight*").catch(() => {});
}

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const cached = await getCached<SystemSettings>(CACHE_KEYS.platformSettings);
    if (cached) return cached;

    const settings = await ensureSettingsRow();
    await setCached(CACHE_KEYS.platformSettings, settings, CACHE_TTL.platformSettings);
    return settings;
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

async function persistSettingsRow(
  dbValues: Omit<typeof platformSettings.$inferInsert, "id" | "updatedAt" | "updatedBy">,
  actorId?: string | null,
): Promise<void> {
  const now = new Date();
  await db
    .insert(platformSettings)
    .values({ id: SETTINGS_ROW_ID, ...dbValues, updatedBy: actorId ?? null, updatedAt: now })
    .onConflictDoUpdate({
      target: platformSettings.id,
      set: { ...dbValues, updatedBy: actorId ?? null, updatedAt: now },
    });
}

export async function saveSystemSettings(
  settings: Partial<SystemSettings>,
  actor?: { id: string; name: string },
): Promise<SystemSettings> {
  const current = await getSystemSettings();
  const updated: SystemSettings = { ...current, ...sanitizeSettingsPatch(settings) };
  const passEncrypted = await readSmtpPassEncrypted();
  updated.smtpPasswordSet = Boolean(passEncrypted.trim());

  await persistSettingsRow(toDbRow(updated, passEncrypted), actor?.id);
  await invalidateSystemSettingsCache();
  return updated;
}

export async function saveSmtpSettings(
  input: SmtpSettingsInput,
  actor?: { id: string; name: string },
): Promise<SystemSettings> {
  const { encryptSecret } = await import("@/lib/crypto/secret");
  const current = await getSystemSettings();
  let passEncrypted = await readSmtpPassEncrypted();

  const password = input.smtpPassword?.trim() ?? "";
  if (password) passEncrypted = encryptSecret(password);

  if (input.smtpUseCustom) {
    if (!input.smtpHost.trim()) throw new Error("El host SMTP es obligatorio cuando usas credenciales personalizadas.");
    if (!input.smtpUser.trim()) throw new Error("El usuario SMTP es obligatorio cuando usas credenciales personalizadas.");
    if (!passEncrypted.trim()) throw new Error("Debes indicar la contraseña SMTP al activar credenciales personalizadas.");
    const fromEmail = input.smtpFromEmail.trim();
    if (fromEmail && !fromEmail.includes("@")) throw new Error("El correo remitente no es válido.");
  }

  const updated: SystemSettings = {
    ...current,
    smtpUseCustom: Boolean(input.smtpUseCustom),
    smtpHost: input.smtpHost.trim(),
    smtpPort: Number.isFinite(input.smtpPort) && input.smtpPort > 0 ? Math.round(input.smtpPort) : 587,
    smtpUser: input.smtpUser.trim(),
    smtpFromEmail: input.smtpFromEmail.trim(),
    smtpFromName: input.smtpFromName.trim(),
    smtpPasswordSet: Boolean(passEncrypted.trim()),
  };

  await persistSettingsRow(toDbRow(updated, passEncrypted), actor?.id);
  await invalidateSystemSettingsCache();
  const { invalidateMailTransporterCache } = await import("@/lib/mail/transporter");
  invalidateMailTransporterCache();

  return updated;
}
