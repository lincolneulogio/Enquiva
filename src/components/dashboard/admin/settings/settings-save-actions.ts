import { toast } from "sonner";
import { saveSystemSettingsAction } from "@/actions/admin/settings";
import {
  normalizePlatformTimezone,
  DEFAULT_PLATFORM_TIMEZONE,
} from "@/lib/settings/platform-locale";
import { fromDatetimeLocalValue } from "@/lib/datetime/zoned-day";
import type { useMaintenanceAnnouncementState } from "./useMaintenanceAnnouncementState";
import type { useSpotlightBannerState } from "./useSpotlightBannerState";

type MaintenanceState = ReturnType<typeof useMaintenanceAnnouncementState>;
type SpotlightState = ReturnType<typeof useSpotlightBannerState>;

export async function executeSavePlatformOps({
  maintenance,
  spotlight,
  timezoneDraft,
  defaultTimezone,
  locale,
}: {
  maintenance: MaintenanceState;
  spotlight: SpotlightState;
  timezoneDraft?: string;
  defaultTimezone?: string;
  locale: string;
}): Promise<boolean> {
  if (maintenance.announcementEnabled && !maintenance.announcementMessage.trim()) {
    toast.error(
      locale === "en"
        ? "Write an announcement message or disable the banner"
        : "Escribe el mensaje del aviso o desactiva el banner",
    );
    return false;
  }

  const tz = normalizePlatformTimezone(
    timezoneDraft || defaultTimezone || DEFAULT_PLATFORM_TIMEZONE,
  );

  const maintenanceStartsAt = fromDatetimeLocalValue(maintenance.maintenanceStartsLocal, tz)?.toISOString() ?? null;
  const maintenanceEndsAt = fromDatetimeLocalValue(maintenance.maintenanceEndsLocal, tz)?.toISOString() ?? null;
  const announcementStartsAt = fromDatetimeLocalValue(maintenance.announcementStartsLocal, tz)?.toISOString() ?? null;
  const announcementEndsAt = fromDatetimeLocalValue(maintenance.announcementEndsLocal, tz)?.toISOString() ?? null;
  const announcementEventAt = fromDatetimeLocalValue(maintenance.announcementEventLocal, tz)?.toISOString() ?? null;

  if (maintenanceStartsAt && maintenanceEndsAt && new Date(maintenanceEndsAt) <= new Date(maintenanceStartsAt)) {
    toast.error(
      locale === "en"
        ? "Maintenance end must be after the start"
        : "El fin del mantenimiento debe ser posterior al inicio",
    );
    return false;
  }
  if (announcementStartsAt && announcementEndsAt && new Date(announcementEndsAt) <= new Date(announcementStartsAt)) {
    toast.error(
      locale === "en" ? "Banner end must be after the start" : "El fin del banner debe ser posterior al inicio",
    );
    return false;
  }

  try {
    const res = await saveSystemSettingsAction({
      maintenanceMode: maintenance.maintenanceMode,
      maintenanceMessage: maintenance.maintenanceMessage.trim(),
      maintenanceStartsAt,
      maintenanceEndsAt,
      announcementEnabled: maintenance.announcementEnabled,
      announcementMessage: maintenance.announcementMessage.trim(),
      announcementSeverity: maintenance.announcementSeverity,
      announcementDismissible: maintenance.announcementDismissible,
      announcementStartsAt,
      announcementEndsAt,
      announcementEventAt,
      eventBannerEnabled: spotlight.eventBannerEnabled,
      eventBannerMode: spotlight.eventBannerMode,
      eventBannerCriteria: spotlight.eventBannerCriteria,
      eventBannerPinnedEventId: spotlight.eventBannerPinnedEventId || null,
      eventBannerCustomBadge: spotlight.eventBannerCustomBadge.trim(),
      eventBannerCustomText: spotlight.eventBannerCustomText.trim(),
    });
    if (res.success) {
      toast.success(
        locale === "en"
          ? "Platform operations & event spotlight saved"
          : "Avisos y banner de eventos guardados con éxito",
      );
      return true;
    }
  } catch (err: unknown) {
    toast.error(err instanceof Error ? err.message : "Error");
  }
  return false;
}
