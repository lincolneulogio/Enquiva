"use client";

import React from "react";

interface EventPresenceCardProps {
  userImage?: string | null;
  userName?: string | null;
  userInitials: string;
  isAuthenticated: boolean;
  otherCount: number;
  totalCount: number;
}

export function EventPresenceCard({
  userImage,
  userName,
  userInitials,
  isAuthenticated,
  otherCount,
  totalCount,
}: EventPresenceCardProps) {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.04] via-white to-white dark:via-card dark:to-card px-4 py-3 shadow-xs flex items-center justify-between gap-3 transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-bold text-foreground tracking-tight">
            Viendo ahora
          </span>
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            En vivo
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center -space-x-1.5">
          {userImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userImage}
              alt={userName || "Tú"}
              className="h-6 w-6 rounded-full object-cover ring-2 ring-white dark:ring-card shadow-xs"
            />
          ) : (
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[9px] font-extrabold text-primary-foreground ring-2 ring-white dark:ring-card shadow-xs"
              title={userName || "Tú"}
            >
              {userInitials}
            </span>
          )}
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground ring-2 ring-white dark:ring-card shadow-xs">
            +{otherCount}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-muted-foreground">
          {isAuthenticated ? `Tú y ${otherCount} más` : `${totalCount} navegando`}
        </span>
      </div>
    </div>
  );
}
