import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { triggerPusher } from "./server";
import { PUSHER_CHANNELS, PUSHER_EVENTS, type TableRefreshPayload } from "./shared";

export type { TableRefreshPayload };

export async function broadcastTableRefresh(payload: TableRefreshPayload) {
  const [event] = payload.eventId
    ? await db
        .select({ organizerId: events.organizerId, organizationId: events.organizationId })
        .from(events)
        .where(eq(events.id, payload.eventId))
        .limit(1)
    : [];
  const organizationId = payload.organizationId ?? event?.organizationId ?? undefined;

  const data: TableRefreshPayload = {
    resource: payload.resource,
    eventId: payload.eventId,
    organizationId,
    userId: payload.userId,
  };

  const scopedBroadcasts = [
    triggerPusher(PUSHER_CHANNELS.platformDashboard, PUSHER_EVENTS.tableRefresh, data),
  ];

  if (organizationId) {
    scopedBroadcasts.push(
      triggerPusher(
        PUSHER_CHANNELS.organizationDashboard(organizationId),
        PUSHER_EVENTS.tableRefresh,
        data,
      ),
    );
  }

  if (event?.organizerId) {
    scopedBroadcasts.push(
      triggerPusher(
        PUSHER_CHANNELS.organizerDashboard(event.organizerId),
        PUSHER_EVENTS.tableRefresh,
        data,
      ),
    );
  }

  if (payload.userId) {
    scopedBroadcasts.push(
      triggerPusher(
        PUSHER_CHANNELS.userNotifications(payload.userId),
        PUSHER_EVENTS.tableRefresh,
        data,
      ),
    );
  }

  if (payload.eventId) {
    scopedBroadcasts.push(
      triggerPusher(PUSHER_CHANNELS.event(payload.eventId), PUSHER_EVENTS.tableRefresh, data),
    );
  }

  await Promise.all(scopedBroadcasts);
}
