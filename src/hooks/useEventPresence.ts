"use client";

import { useEffect, useState } from "react";
import type { Members, PresenceChannel } from "pusher-js";
import { getPusherClient, PUSHER_CHANNELS } from "@/lib/pusher/client";
import type { PresenceUserInfo } from "@/lib/pusher/shared";

export type EventPresenceMember = {
  id: string;
  name: string;
  image: string | null;
  role: string | null;
};

type PresenceListener = (members: EventPresenceMember[]) => void;

function mapMember(id: string, info: PresenceUserInfo | undefined): EventPresenceMember {
  return {
    id,
    name: info?.name?.trim() || "Participante",
    image: info?.image ?? null,
    role: info?.role ?? null,
  };
}

function membersFromPresence(members: Members): EventPresenceMember[] {
  const result: EventPresenceMember[] = [];
  members.each((member: { id: string; info?: PresenceUserInfo }) => {
    result.push(mapMember(member.id, member.info));
  });
  return result;
}

const listenersByEvent = new Map<string, Set<PresenceListener>>();
const channelsByEvent = new Map<string, PresenceChannel>();

function subscribePresence(eventId: string, listener: PresenceListener) {
  const existing = listenersByEvent.get(eventId);
  if (existing) {
    existing.add(listener);
    const channel = channelsByEvent.get(eventId);
    if (channel) {
      listener(membersFromPresence(channel.members));
    }
    return () => unsubscribePresence(eventId, listener);
  }

  const listeners = new Set<PresenceListener>([listener]);
  listenersByEvent.set(eventId, listeners);

  const pusher = getPusherClient();
  const channelName = PUSHER_CHANNELS.presence(eventId);
  const channel = pusher.subscribe(channelName) as PresenceChannel;
  channelsByEvent.set(eventId, channel);

  const sync = () => {
    const snapshot = membersFromPresence(channel.members);
    listenersByEvent.get(eventId)?.forEach((cb) => cb(snapshot));
  };

  channel.bind("pusher:subscription_succeeded", sync);
  channel.bind("pusher:member_added", sync);
  channel.bind("pusher:member_removed", sync);

  return () => unsubscribePresence(eventId, listener);
}

function unsubscribePresence(eventId: string, listener: PresenceListener) {
  const listeners = listenersByEvent.get(eventId);
  if (!listeners) return;
  listeners.delete(listener);
  if (listeners.size > 0) return;

  listenersByEvent.delete(eventId);
  const channel = channelsByEvent.get(eventId);
  channelsByEvent.delete(eventId);
  if (!channel) return;
  channel.unbind_all();
  getPusherClient().unsubscribe(PUSHER_CHANNELS.presence(eventId));
}

export function useEventPresence(eventId: string | null, enabled = true) {
  const [members, setMembers] = useState<EventPresenceMember[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!eventId || !enabled) {
      setMembers([]);
      setReady(false);
      return;
    }

    return subscribePresence(eventId, (snapshot) => {
      setMembers(snapshot);
      setReady(true);
    });
  }, [enabled, eventId]);

  return { members, count: members.length, ready };
}
