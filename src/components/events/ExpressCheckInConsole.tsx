"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Search, CheckCircle, Clock, QrCode, User, Check, Loader2, AlertCircle, Lightbulb, Phone } from "lucide-react";
import { searchPreRegisteredAttendeesAction, checkInAttendee } from "@/actions/registrations";

interface EventOption {
  value: string;
  label: string;
}

interface Attendee {
  registrationId: string;
  eventId: string;
  status: string;
  userName: string | null;
  userEmail: string | null;
  contactPhone: string | null;
  ticketCode: string | null;
  checkedInAt: Date | null;
}

interface ExpressCheckInConsoleProps {
  events: EventOption[];
}

export function ExpressCheckInConsole({ events }: ExpressCheckInConsoleProps) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [query, setQuery] = useState("");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [searching, setSearching] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Search when selected event or query changes
  useEffect(() => {
    if (!selectedEventId) {
      setAttendees([]);
      return;
    }

    if (query.trim().length === 0) {
      setAttendees([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchPreRegisteredAttendeesAction(selectedEventId, query);
        if (res.success) {
          setAttendees(res.attendees as any[] || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setSearching(false);
      }
    }, 300); // 300ms debouncing

    return () => clearTimeout(delayDebounce);
  }, [selectedEventId, query]);

  const handleCheckIn = (attendee: Attendee) => {
    setCheckingId(attendee.registrationId);
    startTransition(async () => {
      try {
        await checkInAttendee({
          registrationId: attendee.registrationId,
          eventId: attendee.eventId,
        });

        toast.success(`¡Check-in exitoso para ${attendee.userName || "el asistente"}!`);
        
        // Update list status locally for instant visual feedback
        setAttendees((prev) =>
          prev.map((a) =>
            a.registrationId === attendee.registrationId
              ? { ...a, status: "checked_in", checkedInAt: new Date() }
              : a
          )
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al realizar check-in.");
      } finally {
        setCheckingId(null);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
      <div className="flex items-center gap-2.5 border-b border-border pb-3">
        <QrCode className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Consola de Check-in Express (Búsqueda Rápida)</h2>
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
              setAttendees([]);
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
              {attendees.map((attendee) => {
                const isChecking = checkingId === attendee.registrationId;
                const isCheckedIn = attendee.status === "checked_in";

                return (
                  <div
                    key={attendee.registrationId}
                    className="flex items-center justify-between p-3.5 hover:bg-secondary/20 transition-colors"
                  >
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
                          onClick={() => handleCheckIn(attendee)}
                          disabled={isChecking || isPending}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-sm disabled:opacity-50"
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
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
