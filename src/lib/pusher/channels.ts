import { PUSHER_CHANNELS } from "./shared";

export type EventRealtimeChannelInput = {
  eventId?: string;
  organizationId?: string | null;
  organizerId?: string | null;
  userId?: string | null;
  includePrivateEvent?: boolean;
  includeDashboards?: boolean;
  includePublicCount?: boolean;
};

/**
 * Destinos de un evento de dominio. El conteo público queda opt-in
 * para no filtrar check-in, pagos ni altas a un canal sin auth.
 */
export function collectEventRealtimeChannels(
  input: EventRealtimeChannelInput,
): string[] {
  const channels: string[] = [];

  if (input.includeDashboards !== false) {
    channels.push(PUSHER_CHANNELS.platformDashboard);
    if (input.organizationId) {
      channels.push(PUSHER_CHANNELS.organizationDashboard(input.organizationId));
    }
    if (input.organizerId) {
      channels.push(PUSHER_CHANNELS.organizerDashboard(input.organizerId));
    }
  }

  if (input.userId) {
    channels.push(PUSHER_CHANNELS.userNotifications(input.userId));
  }

  if (input.includePrivateEvent && input.eventId) {
    channels.push(PUSHER_CHANNELS.event(input.eventId));
  }

  if (input.includePublicCount && input.eventId) {
    channels.push(PUSHER_CHANNELS.publicEventCount(input.eventId));
  }

  return [...new Set(channels)];
}
