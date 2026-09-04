import { getSystemSettings } from "@/lib/settings";
import { PlatformAnnouncementBanner } from "@/components/shared/PlatformAnnouncementBanner";
import { EventSpotlightBanner } from "@/components/shared/EventSpotlightBanner";
import { EventSpotlightService } from "@/services/events/event-spotlight.service";

/**
 * Server wrapper: decide qué banner superior mostrar en la plataforma:
 * 1. Prioridad 1: Aviso crítico u operativo de plataforma (si está activo y tiene mensaje).
 * 2. Prioridad 2: Banner dinámico de eventos destacados (si está habilitado y hay evento candidato).
 */
export async function PlatformAnnouncementBannerHost() {
  const settings = await getSystemSettings().catch(() => null);
  if (!settings) return null;

  // 1. Si hay aviso operativo/mantenimiento activo, se muestra ese
  const hasOpsAnnouncement =
    settings.announcementEnabled && Boolean(settings.announcementMessage.trim());

  if (hasOpsAnnouncement) {
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

  // 2. Si el banner de eventos está habilitado, cargar el evento destacado
  if (settings.eventBannerEnabled) {
    const spotlightEvent = await EventSpotlightService.getSpotlightEvent(settings).catch(() => null);
    if (spotlightEvent) {
      return <EventSpotlightBanner event={spotlightEvent} />;
    }
  }

  return null;
}
