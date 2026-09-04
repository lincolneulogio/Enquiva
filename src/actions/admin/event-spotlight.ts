"use server";

import { requireSuperAdmin } from "./users";
import { getSystemSettings, type SystemSettings } from "@/lib/settings";
import { EventSpotlightService, type EventSpotlightData } from "@/services/events/event-spotlight.service";

/**
 * Retorna la lista de eventos publicados para el dropdown de selección de Super Admin.
 */
export async function getPublishedEventsForAdminAction(): Promise<
  Array<{ id: string; title: string; slug: string; date: string }>
> {
  await requireSuperAdmin();
  return await EventSpotlightService.getPublishedEventsForAdminSelect();
}

/**
 * Obtiene la previsualización en vivo del evento destacado según los parámetros en borrador.
 */
export async function getSpotlightPreviewAction(
  draft: Partial<SystemSettings>,
): Promise<EventSpotlightData | null> {
  await requireSuperAdmin();
  const current = await getSystemSettings();
  const simulated: SystemSettings = {
    ...current,
    ...draft,
    eventBannerEnabled: true, // Forzar activo para la previsualización
  };

  return await EventSpotlightService.getSpotlightEvent(simulated);
}
