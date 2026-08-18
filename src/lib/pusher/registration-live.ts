import "server-only";

import { redis, CACHE_KEYS } from "@/lib/redis";
import { getEventCapacitySnapshot } from "@/lib/events/capacity-snapshot";
import { broadcastTableRefresh } from "./table-refresh";
import { broadcastAttendeeCountUpdated, broadcastNewRegistration } from "./broadcast";
import type { NewRegistrationPayload, TableResource } from "./shared";

export type PublishRegistrationRealtimeInput = {
  eventId: string;
  organizationId?: string | null;
  userId?: string;
  status?: NewRegistrationPayload["status"];
  source?: NewRegistrationPayload["source"];
  resource?: TableResource | TableResource[];
};

async function persistAttendeeCountCache(eventId: string, count: number) {
  try {
    await redis.set(CACHE_KEYS.eventAttendeesCount(eventId), count);
  } catch (error) {
    console.error("Fallo al actualizar contador de asistentes en Redis", error);
  }
}

/**
 * Cupos públicos + new-registration en staff/evento + refresh de tablas.
 */
export async function publishRegistrationRealtime(input: PublishRegistrationRealtimeInput) {
  const snapshot = await getEventCapacitySnapshot(input.eventId, null);
  const countPayload = {
    eventId: input.eventId,
    count: snapshot.occupied,
    waitlisted: snapshot.waitlisted,
  };

  await persistAttendeeCountCache(input.eventId, snapshot.occupied);
  await broadcastAttendeeCountUpdated(countPayload, {
    eventId: input.eventId,
    organizationId: input.organizationId,
    userId: input.userId,
  });

  if (input.status && input.source) {
    await broadcastNewRegistration(
      {
        ...countPayload,
        status: input.status,
        source: input.source,
      },
      {
        eventId: input.eventId,
        organizationId: input.organizationId,
        userId: input.userId,
      },
    );
  }

  await broadcastTableRefresh({
    resource: input.resource ?? ["registrations", "attendees", "events"],
    eventId: input.eventId,
    organizationId: input.organizationId ?? undefined,
    userId: input.userId,
  });
}
