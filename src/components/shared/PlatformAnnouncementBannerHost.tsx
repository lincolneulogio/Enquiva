import { headers } from "next/headers";
import { getPlatformOpsStatus, getSystemSettings } from "@/lib/settings";
import { PlatformAnnouncementBanner } from "@/components/shared/PlatformAnnouncementBanner";

/** Server wrapper: carga el aviso global y lo muestra en toda la app. */
export async function PlatformAnnouncementBannerHost() {
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (pathname === "/maintenance") return null;

  const [ops, settings] = await Promise.all([
    getPlatformOpsStatus(),
    getSystemSettings().catch(() => null),
  ]);

  // Si está habilitado, el cliente decide la ventana (para activarse sin refresh).
  if (!ops.announcementEnabled || !ops.announcementMessage.trim()) {
    return null;
  }

  return (
    <PlatformAnnouncementBanner
      enabled={ops.announcementEnabled}
      message={ops.announcementMessage}
      severity={ops.announcementSeverity}
      dismissible={ops.announcementDismissible}
      startsAt={ops.announcementStartsAt}
      endsAt={ops.announcementEndsAt}
      eventAt={ops.announcementEventAt}
      timeZone={settings?.defaultTimezone}
    />
  );
}
