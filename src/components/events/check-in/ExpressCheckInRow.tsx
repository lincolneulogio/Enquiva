"use client";

import React from "react";
import { CheckCircle, Check, Loader2, Phone } from "lucide-react";
import type { Attendee } from "./types";

interface ExpressCheckInRowProps {
  attendee: Attendee;
  isChecking: boolean;
  isPending: boolean;
  onCheckIn: (attendee: Attendee) => void;
}

export function ExpressCheckInRow({
  attendee,
  isChecking,
  isPending,
  onCheckIn,
}: ExpressCheckInRowProps) {
  const isCheckedIn = attendee.status === "checked_in";

  return (
    <div className="flex items-center justify-between p-3.5 hover:bg-secondary/20 transition-colors">
      <div className="min-w-0 flex-1 pr-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-foreground text-sm truncate">
            {attendee.userName || "Participante"}
          </span>
          {attendee.ticketCode && (
            <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary tracking-wider font-mono">
              {attendee.ticketCode}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground flex-wrap">
          <span className="truncate">{attendee.userEmail}</span>
          {attendee.contactPhone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3 shrink-0" />
              {attendee.contactPhone}
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0">
        {isCheckedIn ? (
          <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-semibold text-xs px-3 py-1.5 bg-green-500/10 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            Ingresó
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onCheckIn(attendee)}
            disabled={isChecking || isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isChecking ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            Check-in Rápido
          </button>
        )}
      </div>
    </div>
  );
}
