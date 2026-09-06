"use client";

import React from "react";
import { Loader2, Lightbulb, AlertCircle } from "lucide-react";
import type { Attendee } from "./types";
import { ExpressCheckInRow } from "./ExpressCheckInRow";

interface ExpressCheckInResultsProps {
  searching: boolean;
  query: string;
  attendees: Attendee[];
  checkingId: string | null;
  isPending: boolean;
  onCheckIn: (attendee: Attendee) => void;
}

export function ExpressCheckInResults({
  searching,
  query,
  attendees,
  checkingId,
  isPending,
  onCheckIn,
}: ExpressCheckInResultsProps) {
  return (
    <div className="mt-3">
      {searching ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Buscando coincidencias...
        </div>
      ) : query.trim().length === 0 ? (
        <div className="flex items-center justify-center gap-1.5 py-6 text-xs text-muted-foreground/80 bg-secondary/10 rounded-xl border border-border/40">
          <Lightbulb className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          Escribe los primeros caracteres del asistente para listarlo inmediatamente.
        </div>
      ) : attendees.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground text-xs gap-2 border border-dashed rounded-xl">
          <AlertCircle className="h-4 w-4 text-muted-foreground/60" />
          No se encontraron asistentes registrados coincidentes.
        </div>
      ) : (
        <div className="border border-border rounded-xl divide-y divide-border overflow-hidden bg-background max-h-[360px] overflow-y-auto">
          {attendees.map((attendee) => (
            <ExpressCheckInRow
              key={attendee.registrationId}
              attendee={attendee}
              isChecking={checkingId === attendee.registrationId}
              isPending={isPending}
              onCheckIn={onCheckIn}
            />
          ))}
        </div>
      )}
    </div>
  );
}
