/**
 * System Settings Service & Types
 * Re-exports from modularized sub-modules in @/lib/settings/
 */
export type {
  AnnouncementSeverity,
  PlatformOpsStatus,
} from "@/lib/settings/platform-ops";

export {
  normalizeOptionalIsoDate,
  SETTINGS_ROW_ID,
  DEFAULT_SETTINGS,
  describeSettingsChanges,
  type SystemSettings,
  type SmtpSettingsInput,
} from "./settings/settings-types";

export {
  rowToSettings,
  sanitizeSettingsPatch,
  toDbRow,
} from "./settings/settings-sanitize";

export {
  readSmtpPassEncrypted,
  readLegacyJsonSettings,
  ensureSettingsRow,
  invalidateSystemSettingsCache,
  getSystemSettings,
  getPlatformOpsStatus,
  saveSystemSettings,
  saveSmtpSettings,
} from "./settings/settings-db";
