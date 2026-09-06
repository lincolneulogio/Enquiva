"use client";

import { useState } from "react";
import { Search, QrCode } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { EventPresenceIndicator } from "@/components/events/EventPresenceIndicator";
import {
  type EventOption,
  useExpressCheckIn,
  ExpressCheckInResults,
} from "./check-in";

export type { EventOption };

interface ExpressCheckInConsoleProps {
  events: EventOption[];
}

export function ExpressCheckInConsole({ events }: ExpressCheckInConsoleProps) {
  const t = useTranslations();
  const [selectedEventId, setSelectedEventId] = useState("");
  const [query, setQuery] = useState("");

  const {
    attendees,
    searching,
    checkingId,
    isPending,
    handleCheckIn,
  } = useExpressCheckIn(selectedEventId, query, t);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
      <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <QrCode className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Consola de Check-in Express (Búsqueda Rápida)</h2>
        </div>
        {selectedEventId ? (
          <EventPresenceIndicator eventId={selectedEventId} variant="staff" className="sm:max-w-sm" />
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 items-end">
        {/* Event Selection */}
        <div className="space-y-1.5 sm:col-span-1">
          <label htmlFor="express-event-select" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Evento Seleccionado
          </label>
          <select
            id="express-event-select"
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setQuery("");
            }}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">-- Selecciona el evento --</option>
            {events.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        {/* Query Input */}
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="express-search-input" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Buscar Asistente
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="express-search-input"
              type="text"
              placeholder={
                selectedEventId
                  ? "Escribe nombre, correo, ticket o teléfono..."
                  : "Selecciona primero un evento arriba"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={!selectedEventId}
              className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      {/* Results Box */}
      {selectedEventId && (
        <ExpressCheckInResults
          searching={searching}
          query={query}
          attendees={attendees}
          checkingId={checkingId}
          isPending={isPending}
          onCheckIn={handleCheckIn}
        />
      )}
    </div>
  );
}
