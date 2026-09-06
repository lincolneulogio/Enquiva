"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher/client";
import type { TableRefreshPayload } from "@/lib/pusher/shared";

export function EventsCatalogRealtimeSync() {
  const router = useRouter();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const pusher = getPusherClient();
    const channelName = PUSHER_CHANNELS.publicEventsCatalog;
    const channel = pusher.subscribe(channelName);

    const handleRefresh = (data?: TableRefreshPayload) => {
      const resources = Array.isArray(data?.resource) ? data?.resource : [data?.resource];
      if (data && !resources.includes("events")) return;

      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        router.refresh();
      }, 500);
    };

    channel.bind(PUSHER_EVENTS.tableRefresh, handleRefresh);

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      channel.unbind(PUSHER_EVENTS.tableRefresh, handleRefresh);
    };
  }, [router]);

  return null;
}
