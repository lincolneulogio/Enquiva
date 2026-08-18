"use client";

import { useEffect, useRef } from "react";
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
  const onNotificationRef = useRef(onNotification);

  // Mantener la referencia actualizada con la última función provista
  useEffect(() => {
    onNotificationRef.current = onNotification;
  });

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(PUSHER_CHANNELS.userNotifications(userId));

    channel.bind(PUSHER_EVENTS.notificationCreated, (data: {
      title: string;
      message: string;
    }) => {
      toast.info(data.title, { description: data.message });
      onNotificationRef.current?.(data);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(PUSHER_CHANNELS.userNotifications(userId));
    };
  }, [userId]);
}
