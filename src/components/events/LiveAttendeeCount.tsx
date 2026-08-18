"use client";

import { useLiveAttendeeCount } from "@/hooks/useLiveAttendeeCount";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/utils";

interface LiveAttendeeCountProps {
  eventId: string;
  initialCount: number;
  initialWaitlisted?: number;
  capacity?: number | null;
  variant?: "inline" | "detail" | "sidebar" | "table";
  className?: string;
}

export function LiveAttendeeCount({
  eventId,
  initialCount,
  initialWaitlisted = 0,
  capacity,
  variant = "inline",
  className,
}: LiveAttendeeCountProps) {
  const t = useTranslations();
  const { count, waitlisted } = useLiveAttendeeCount(
    eventId,
    initialCount,
    initialWaitlisted,
  );

  const remaining = capacity == null ? null : Math.max(0, capacity - count);
  const percentage = capacity ? Math.min((count / capacity) * 100, 100) : null;
  const isNearlyFull = percentage != null && percentage >= 80;
  const isFull = capacity != null && count >= capacity;

  if (variant === "table") {
    return (
      <span className={cn("tabular-nums", className)}>
        {count}
        {capacity != null ? ` / ${capacity}` : ""}
      </span>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className={cn("space-y-1", className)}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 leading-none">
          {t("public.eventDetail.attendeesLabel")}
        </p>
        <p className="text-3xl font-extrabold text-foreground leading-none pt-1 tabular-nums">
          {count.toLocaleString()}
        </p>
        {waitlisted > 0 ? (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {t("realtime.waitlisted", { count: waitlisted })}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground font-medium pt-0.5">
          {t("public.eventDetail.attendingSuffix")}
        </p>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className={cn("space-y-1", className)}>
        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
          {t("public.eventDetail.capacityLabel")}
        </span>
        <span className="font-semibold text-foreground text-sm leading-tight block tabular-nums">
          {capacity == null
            ? t("public.eventDetail.unlimited")
            : `${count} / ${capacity}`}
        </span>
        <span className="block text-[11px] text-muted-foreground">
          {remaining != null
            ? t("realtime.remaining", { count: remaining })
            : t("realtime.unlimited")}
          {waitlisted > 0 ? ` · ${t("realtime.waitlisted", { count: waitlisted })}` : ""}
        </span>
        {percentage != null && (
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isNearlyFull ? "bg-amber-500" : "bg-primary",
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <span className={cn("tabular-nums", className)}>
      {capacity != null ? (
        <>
          {t("common.registeredCount", { count, capacity })}
          {isFull && (
            <span className="ml-1 font-bold text-destructive">({t("common.full")})</span>
          )}
        </>
      ) : (
        `${count} ${t("eventCard.registered")}`
      )}
    </span>
  );
}
