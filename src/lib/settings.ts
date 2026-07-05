import fs from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { platformSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface SystemSettings {
  organizationName: string;
  supportEmail: string;
  alertNewPayments: boolean;
  alertTransportCapacity: boolean;
  alertDailyFinanceSummary: boolean;
}

const SETTINGS_ROW_ID = "default";

const LEGACY_SETTINGS_FILE_PATH = path.join(process.cwd(), "src/lib/db/system-settings.json");

export const DEFAULT_SETTINGS: SystemSettings = {
  organizationName: "Eventia",
  supportEmail: "soporte@eventia.app",
  alertNewPayments: true,
  alertTransportCapacity: true,
  alertDailyFinanceSummary: false,
};

function rowToSettings(row: typeof platformSettings.$inferSelect): SystemSettings {
  return {
    organizationName: row.organizationName,
    supportEmail: row.supportEmail,
    alertNewPayments: row.alertNewPayments,
    alertTransportCapacity: row.alertTransportCapacity,
    alertDailyFinanceSummary: row.alertDailyFinanceSummary,
  };
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

export async function saveSystemSettings(
  settings: Partial<SystemSettings>,
  actor?: { id: string; name: string },
): Promise<SystemSettings> {
  const current = await getSystemSettings();
  const updated: SystemSettings = { ...current, ...settings };

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
