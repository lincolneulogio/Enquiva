"use client";

import { useEffect, useState } from "react";
import { getPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher/client";
import { useTranslations } from "@/components/providers/LocaleProvider";

interface LiveAttendeeCountProps {
  eventId: string;
  initialCount: number;
  capacity?: number | null;
}

export function LiveAttendeeCount({
  eventId,
  initialCount,
  capacity,
}: LiveAttendeeCountProps) {
  const t = useTranslations();
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(PUSHER_CHANNELS.publicEventCount(eventId));

    channel.bind(
      PUSHER_EVENTS.attendeeCountUpdated,
      (data: { count: number }) => {
        setCount(data.count);
      }
    );

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(PUSHER_CHANNELS.publicEventCount(eventId));
    };
  }, [eventId]);

  const percentage = capacity ? Math.min((count / capacity) * 100, 100) : null;
  const isNearlyFull = percentage != null && percentage >= 80;

  return (
    <div className="mt-0.5">
      <p className="text-sm text-muted-foreground">
        <span
          className={
            isNearlyFull ? "font-medium text-amber-600 dark:text-amber-400" : ""
          }
        >
          {count}
        </span>
        {capacity != null && (
          <span>
            {" "}
            {t("common.registeredCount", { count, capacity })}
          </span>
        )}
        {capacity == null && ` ${t("eventCard.registered")}`}
      </p>
      {percentage != null && (
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isNearlyFull ? "bg-amber-500" : "bg-primary"
              }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
