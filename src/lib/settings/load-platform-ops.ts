import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { platformSettings } from "@/lib/db/schema/platform-settings";
import {
  getDefaultPlatformOpsStatus,
  opsStatusFromSettings,
  type PlatformOpsStatus,
} from "@/lib/settings/platform-ops";

const SETTINGS_ROW_ID = "default";

export async function loadPlatformOpsStatus(): Promise<PlatformOpsStatus> {
  try {
    const [row] = await db
      .select({
        maintenanceMode: platformSettings.maintenanceMode,
        maintenanceMessage: platformSettings.maintenanceMessage,
        maintenanceStartsAt: platformSettings.maintenanceStartsAt,
        maintenanceEndsAt: platformSettings.maintenanceEndsAt,
        announcementEnabled: platformSettings.announcementEnabled,
        announcementMessage: platformSettings.announcementMessage,
        announcementSeverity: platformSettings.announcementSeverity,
        announcementDismissible: platformSettings.announcementDismissible,
        announcementStartsAt: platformSettings.announcementStartsAt,
        announcementEndsAt: platformSettings.announcementEndsAt,
        announcementEventAt: platformSettings.announcementEventAt,
      })
      .from(platformSettings)
      .where(eq(platformSettings.id, SETTINGS_ROW_ID))
      .limit(1);

    if (!row) {
      return getDefaultPlatformOpsStatus();
    }

    return opsStatusFromSettings(row);
  } catch {
    return getDefaultPlatformOpsStatus();
  }
}
