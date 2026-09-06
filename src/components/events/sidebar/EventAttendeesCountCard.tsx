"use client";

import React from "react";
import { Users } from "lucide-react";
import { useLiveAttendeeCount } from "@/hooks/useLiveAttendeeCount";

interface EventAttendeesCountCardProps {
  eventId?: string;
  occupied: number;
  capacity?: number | null;
}

export function EventAttendeesCountCard({
  eventId,
  occupied: initialOccupied,
  capacity,
}: EventAttendeesCountCardProps) {
  const { count } = useLiveAttendeeCount(eventId ?? "", initialOccupied);
  const occupied = eventId ? count : initialOccupied;
  const remaining = capacity != null ? Math.max(0, capacity - occupied) : null;
  const isScarce = remaining != null && remaining <= 10 && remaining > 0;

  return (
    <div className="rounded-2xl border border-border/80 bg-white dark:bg-card p-4 sm:p-5 shadow-xs space-y-2">
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Users className="h-5 w-5" />
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            ASISTENTES
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-foreground transition-all duration-300">
              {occupied}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">
              asistiendo
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed pt-1">
        {occupied === 0
          ? "Sé la primera persona en asegurar su cupo para esta edición 2026."
          : `${occupied} persona${occupied > 1 ? "s" : ""} ya aseguró su cupo para esta edición 2026.`}
      </p>

      {isScarce && (
        <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex items-center gap-1.5 text-xs font-black text-amber-700 dark:text-amber-300 animate-pulse">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>¡Solo quedan {remaining} entradas disponibles!</span>
        </div>
      )}
    </div>
  );
}
