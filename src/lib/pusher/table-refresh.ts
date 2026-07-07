import "server-only";

import { triggerPusher } from "./server";
import { PUSHER_CHANNELS, PUSHER_EVENTS, type TableRefreshPayload } from "./shared";

export type { TableRefreshPayload };

export async function broadcastTableRefresh(payload: TableRefreshPayload) {
  const data: TableRefreshPayload = {
    resource: payload.resource,
    eventId: payload.eventId,
    organizationId: payload.organizationId,
    userId: payload.userId,
  };

  await triggerPusher(PUSHER_CHANNELS.adminDashboard, PUSHER_EVENTS.tableRefresh, data);

  if (payload.userId) {
    await triggerPusher(PUSHER_CHANNELS.userNotifications(payload.userId), PUSHER_EVENTS.tableRefresh, data);
  }

  if (payload.eventId) {
    await triggerPusher(PUSHER_CHANNELS.event(payload.eventId), PUSHER_EVENTS.tableRefresh, data);
  }
}
