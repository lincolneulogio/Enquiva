"use client";

import React from "react";

interface GuestAttendanceTrackerProps {
  totalCheckedIn: number;
  totalAttendees: number;
  locale: string;
}

export function GuestAttendanceTracker({
  totalCheckedIn,
  totalAttendees,
  locale,
}: GuestAttendanceTrackerProps) {
  if (totalAttendees <= 1) return null;

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4.5 space-y-3 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs font-bold uppercase tracking-wider text-primary">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          {locale === "en"
            ? "Group Check-In Tracker (Live)"
            : "Ingreso del Grupo en Tiempo Real"}
        </span>
        <span className="bg-primary/10 border border-primary/25 px-2.5 py-0.5 rounded-full text-[10px]">
          {totalCheckedIn} / {totalAttendees}{" "}
          {locale === "en" ? "Checked In" : "Ingresados"}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-secondary dark:bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 rounded-full"
          style={{ width: `${(totalCheckedIn / totalAttendees) * 100}%` }}
        />
      </div>
    </div>
  );
}
