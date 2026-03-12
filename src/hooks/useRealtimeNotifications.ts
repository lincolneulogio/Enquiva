"use client";

import { useEffect, useCallback } from "react";
import { getPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher/client";
import { toast } from "sonner";

interface UseRealtimeNotificationsProps {
  userId: string;
  onNotification?: (data: unknown) => void;
}

export function useRealtimeNotifications({
  userId,
  onNotification,
}: UseRealtimeNotificationsProps) {
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(PUSHER_CHANNELS.userNotifications(userId));

    channel.bind(PUSHER_EVENTS.notificationCreated, (data: {
      title: string;
      message: string;
    }) => {
      toast.info(data.title, { description: data.message });
      onNotification?.(data);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(PUSHER_CHANNELS.userNotifications(userId));
    };
  }, [userId, onNotification]);
}

export function useEventPresence(eventId: string) {
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(PUSHER_CHANNELS.presence(eventId));

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(PUSHER_CHANNELS.presence(eventId));
    };
  }, [eventId]);
}
