import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { triggerPusher } from "./server";
import {
  PUSHER_EVENTS,
  type AttendeeCountUpdatedPayload,
  type CheckInPayload,
  type EventUpdatedPayload,
  type NewRegistrationPayload,
  type PaymentUpdatedPayload,
  type TableRefreshPayload,
} from "./shared";
import { collectEventRealtimeChannels } from "./channels";

export type EventBroadcastContext = {
  eventId?: string;
  organizationId?: string | null;
  organizerId?: string | null;
  userId?: string | null;
};

export type ResolvedEventBroadcastContext = {
  eventId?: string;
  organizationId?: string;
  organizerId?: string;
  userId?: string;
};

export async function resolveEventBroadcastContext(
  input: EventBroadcastContext,
): Promise<ResolvedEventBroadcastContext> {
  const [event] = input.eventId
    ? await db
        .select({ organizerId: events.organizerId, organizationId: events.organizationId })
        .from(events)
        .where(eq(events.id, input.eventId))
        .limit(1)
    : [];

  return {
    eventId: input.eventId,
    organizationId: input.organizationId ?? event?.organizationId ?? undefined,
    organizerId: event?.organizerId ?? input.organizerId ?? undefined,
    userId: input.userId ?? undefined,
  };
}

export async function broadcastEventRealtime<T>(
  eventName: string,
  data: T,
  input: EventBroadcastContext & {
    includePrivateEvent?: boolean;
    includeDashboards?: boolean;
    includePublicCount?: boolean;
  },
) {
  const context = await resolveEventBroadcastContext(input);
  const channels = collectEventRealtimeChannels({
    ...context,
    includePrivateEvent: input.includePrivateEvent,
    includeDashboards: input.includeDashboards,
    includePublicCount: input.includePublicCount,
  });
  await triggerPusher(channels, eventName, data);
}

export async function broadcastAttendeeCountUpdated(
  payload: AttendeeCountUpdatedPayload,
  context: EventBroadcastContext = {},
) {
  await broadcastEventRealtime(PUSHER_EVENTS.attendeeCountUpdated, payload, {
    ...context,
    eventId: payload.eventId,
    includePrivateEvent: true,
    includePublicCount: true,
  });
}

export async function broadcastNewRegistration(
  payload: NewRegistrationPayload,
  context: EventBroadcastContext = {},
) {
  await broadcastEventRealtime(PUSHER_EVENTS.newRegistration, payload, {
    ...context,
    eventId: payload.eventId,
    includePrivateEvent: true,
  });
}

export async function broadcastCheckIn(
  payload: CheckInPayload,
  context: EventBroadcastContext & { eventId: string },
) {
  await broadcastEventRealtime(PUSHER_EVENTS.checkIn, payload, {
    ...context,
    includePrivateEvent: true,
  });
}

export async function broadcastPaymentUpdated(
  payload: PaymentUpdatedPayload,
  context: EventBroadcastContext = {},
) {
  await broadcastEventRealtime(PUSHER_EVENTS.paymentUpdated, payload, {
    ...context,
    eventId: payload.eventId,
    includePrivateEvent: true,
  });
}

export async function broadcastEventUpdated(
  payload: EventUpdatedPayload,
  context: EventBroadcastContext = {},
) {
  await broadcastEventRealtime(PUSHER_EVENTS.eventUpdated, payload, {
    ...context,
    eventId: payload.eventId,
    includePrivateEvent: true,
  });
}

export type { TableRefreshPayload };
