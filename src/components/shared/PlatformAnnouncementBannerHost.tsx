import { headers } from "next/headers";
import { getPlatformOpsStatus } from "@/lib/settings";
import { PlatformAnnouncementBanner } from "@/components/shared/PlatformAnnouncementBanner";

/** Server wrapper: carga el aviso global y lo muestra en toda la app. */
export async function PlatformAnnouncementBannerHost() {
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (pathname === "/maintenance") return null;

  const ops = await getPlatformOpsStatus();
  if (!ops.announcementEnabled || !ops.announcementMessage.trim()) {
    return null;
  }

  return (
    <PlatformAnnouncementBanner
      enabled={ops.announcementEnabled}
      message={ops.announcementMessage}
      severity={ops.announcementSeverity}
      dismissible={ops.announcementDismissible}
    />
  );
}
