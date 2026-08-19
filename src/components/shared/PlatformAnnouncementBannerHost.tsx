import { getSystemSettings } from "@/lib/settings";
import { PlatformAnnouncementBanner } from "@/components/shared/PlatformAnnouncementBanner";

/** Server wrapper: carga el aviso global y lo muestra en toda la app. */
export async function PlatformAnnouncementBannerHost() {
  const settings = await getSystemSettings().catch(() => null);
  if (!settings?.announcementEnabled || !settings.announcementMessage.trim()) {
    return null;
  }

  return (
    <PlatformAnnouncementBanner
      enabled={settings.announcementEnabled}
      message={settings.announcementMessage}
      severity={settings.announcementSeverity}
      dismissible={settings.announcementDismissible}
      startsAt={settings.announcementStartsAt}
      endsAt={settings.announcementEndsAt}
      eventAt={settings.announcementEventAt}
      timeZone={settings.defaultTimezone}
    />
  );
}

