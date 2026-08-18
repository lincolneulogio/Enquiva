"use client";

import { useEffect, useState } from "react";
import type { Channel } from "pusher-js";
import { getPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher/client";
import type { AttendeeCountUpdatedPayload } from "@/lib/pusher/shared";

type CountListener = (payload: AttendeeCountUpdatedPayload) => void;

const listenersByEvent = new Map<string, Set<CountListener>>();
const channelsByEvent = new Map<string, Channel>();

function subscribePublicCount(eventId: string, listener: CountListener) {
  const existing = listenersByEvent.get(eventId);
  if (existing) {
    existing.add(listener);
    return () => unsubscribePublicCount(eventId, listener);
  }

  const listeners = new Set<CountListener>([listener]);
  listenersByEvent.set(eventId, listeners);

  const pusher = getPusherClient();
  const channelName = PUSHER_CHANNELS.publicEventCount(eventId);
  const channel = pusher.subscribe(channelName);
  channelsByEvent.set(eventId, channel);

  channel.bind(PUSHER_EVENTS.attendeeCountUpdated, (data: AttendeeCountUpdatedPayload) => {
    listenersByEvent.get(eventId)?.forEach((cb) => cb(data));
  });

  return () => unsubscribePublicCount(eventId, listener);
}

function unsubscribePublicCount(eventId: string, listener: CountListener) {
  const listeners = listenersByEvent.get(eventId);
  if (!listeners) return;
  listeners.delete(listener);
  if (listeners.size > 0) return;

  listenersByEvent.delete(eventId);
  const channel = channelsByEvent.get(eventId);
  channelsByEvent.delete(eventId);
  if (!channel) return;
  channel.unbind_all();
  getPusherClient().unsubscribe(PUSHER_CHANNELS.publicEventCount(eventId));
}

export function useLiveAttendeeCount(
  eventId: string,
  initialCount: number,
  initialWaitlisted = 0,
) {
  const [count, setCount] = useState(initialCount);
  const [waitlisted, setWaitlisted] = useState(initialWaitlisted);

  useEffect(() => {
    setCount(initialCount);
    setWaitlisted(initialWaitlisted);
  }, [eventId, initialCount, initialWaitlisted]);

  useEffect(() => {
    return subscribePublicCount(eventId, (payload) => {
      if (payload.eventId && payload.eventId !== eventId) return;
      setCount(payload.count);
      if (typeof payload.waitlisted === "number") {
        setWaitlisted(payload.waitlisted);
      }
    });
  }, [eventId]);

  return { count, waitlisted };
}
