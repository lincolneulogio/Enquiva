"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher/client";
import type { EventUpdatedPayload } from "@/lib/pusher/shared";
import { toast } from "sonner";

interface EventPublicRealtimeSyncProps {
  eventId: string;
}

export function EventPublicRealtimeSync({ eventId }: EventPublicRealtimeSyncProps) {
  const router = useRouter();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const pusher = getPusherClient();
    const channelName = PUSHER_CHANNELS.publicEventCount(eventId);
    const channel = pusher.subscribe(channelName);

    const handleEventUpdated = (data: EventUpdatedPayload) => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        router.refresh();
        toast.info(
          data?.title
            ? `El evento "${data.title}" ha sido actualizado en vivo.`
            : "La información del evento ha sido actualizada en vivo.",
          {
            duration: 4000,
            id: `event-sync-${eventId}`,
          },
        );
      }, 350);
    };

    const handleAttendeeCountUpdated = () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        router.refresh();
      }, 500);
    };

    channel.bind(PUSHER_EVENTS.eventUpdated, handleEventUpdated);
    channel.bind(PUSHER_EVENTS.attendeeCountUpdated, handleAttendeeCountUpdated);

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      channel.unbind(PUSHER_EVENTS.eventUpdated, handleEventUpdated);
      channel.unbind(PUSHER_EVENTS.attendeeCountUpdated, handleAttendeeCountUpdated);
    };
  }, [eventId, router]);

  return null;
}
