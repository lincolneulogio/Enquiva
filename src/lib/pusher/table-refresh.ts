import "server-only";

import { triggerPusher } from "./server";
import { PUSHER_EVENTS, type TableRefreshPayload } from "./shared";
import { collectEventRealtimeChannels } from "./channels";
import { resolveEventBroadcastContext } from "./broadcast";

export type { TableRefreshPayload };

export async function broadcastTableRefresh(payload: TableRefreshPayload) {
  const context = await resolveEventBroadcastContext({
    eventId: payload.eventId,
    organizationId: payload.organizationId,
    userId: payload.userId,
  });

  const data: TableRefreshPayload = {
    resource: payload.resource,
    eventId: payload.eventId,
    organizationId: context.organizationId,
    userId: payload.userId,
  };

  const channels = collectEventRealtimeChannels({
    ...context,
    includePrivateEvent: Boolean(payload.eventId),
  });

  await triggerPusher(channels, PUSHER_EVENTS.tableRefresh, data);
}
