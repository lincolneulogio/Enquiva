"use client";

import React from "react";
import { MapPin, Trash2, Plus, Loader2 } from "lucide-react";
import { getIntlLocale } from "@/lib/i18n/core";
import { StopMapPicker } from "@/components/dashboard/organizer/StopMapPicker";
import { DateAmPmTimeField } from "@/components/ui/DateAmPmTimeField";
import { StopRow } from "./types";

interface StopsManagerProps {
  routeId: string;
  stops: StopRow[];
  locale: "es" | "en";
  minDate: string;
  newStopName: string;
  setNewStopName: (val: string) => void;
  newStopLat: number | null;
  setNewStopLat: (val: number | null) => void;
  newStopLng: number | null;
  setNewStopLng: (val: number | null) => void;
  newStopEtaDate: string;
  setNewStopEtaDate: (val: string) => void;
  newStopEtaClock: string;
  setNewStopEtaClock: (val: string) => void;
  newStopMaxSeats: string;
  setNewStopMaxSeats: (val: string) => void;
  stopPending: boolean;
  onAddStop: () => void;
  onDeleteStop: (stopId: string) => void;
  onMoveStop: (index: number, direction: "up" | "down") => void;
}

export function StopsManager({
  routeId,
  stops,
  locale,
  minDate,
  newStopName,
  setNewStopName,
  newStopLat,
  setNewStopLat,
  newStopLng,
  setNewStopLng,
  newStopEtaDate,
  setNewStopEtaDate,
  newStopEtaClock,
  setNewStopEtaClock,
  newStopMaxSeats,
  setNewStopMaxSeats,
  stopPending,
  onAddStop,
  onDeleteStop,
  onMoveStop,
}: StopsManagerProps) {
  return (
    <div className="mt-4 rounded-xl border border-border/80 bg-muted/20 p-4 space-y-4 animate-in fade-in-50 duration-200">
      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        Paraderos Intermedios
      </h4>

      {!stops || stops.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No hay paraderos adicionales. Los pasajeros subirán en el punto de salida general.
        </p>
      ) : (
        <div className="space-y-2">
          {[...stops]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((stop, index) => (
              <div
                key={stop.id}
                className="flex items-center justify-between rounded-lg bg-background p-2.5 text-xs border border-border/60 hover:shadow-xs transition-all gap-2"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="font-semibold text-foreground">
                    {index + 1}. {stop.name}
                  </p>
                  {stop.estimatedArrivalTime && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      ETA:{" "}
                      {new Date(stop.estimatedArrivalTime).toLocaleString(
                        getIntlLocale(locale),
                        { dateStyle: "short", timeStyle: "short" },
                      )}
                    </p>
                  )}
                  {stop.maxSeats != null && (
                    <p className="text-[10px] text-muted-foreground">
                      Cupo paradero: {stop.maxSeats}
                    </p>
                  )}
                  {stop.latitude && stop.longitude && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-0.5 text-[10px] text-primary hover:underline"
                    >
                      Ver en Google Maps
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title="Subir"
                    disabled={index === 0}
                    onClick={() => onMoveStop(index, "up")}
                    className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    title="Bajar"
                    disabled={index >= stops.length - 1}
                    onClick={() => onMoveStop(index, "down")}
                    className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30 cursor-pointer"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteStop(stop.id)}
                    className="rounded p-1.5 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    title="Eliminar paradero"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="border-t border-border/60 pt-3.5 space-y-3">
        <span className="block text-xs font-bold text-foreground">
          Agregar Paradero Intermedio
        </span>
        <input
          type="text"
          placeholder="Nombre (ej: Óvalo Grau / Panadería X)"
          value={newStopName}
          onChange={(e) => setNewStopName(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        />
        <DateAmPmTimeField
          dateValue={newStopEtaDate}
          timeValue={newStopEtaClock}
          minDate={minDate}
          dateLabel="Día ETA"
          timeLabel="Hora ETA"
          onDateChange={setNewStopEtaDate}
          onTimeChange={setNewStopEtaClock}
        />
        <div>
          <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
            Cupo máx. paradero (opcional)
          </label>
          <input
            type="number"
            min={1}
            placeholder="Sin límite"
            value={newStopMaxSeats}
            onChange={(e) => setNewStopMaxSeats(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs"
          />
        </div>
        <StopMapPicker
          address={newStopName}
          latitude={newStopLat}
          longitude={newStopLng}
          onAddressChange={setNewStopName}
          onCoordsChange={(coords) => {
            setNewStopLat(coords?.lat ?? null);
            setNewStopLng(coords?.lng ?? null);
          }}
        />
        <button
          type="button"
          onClick={onAddStop}
          disabled={stopPending || !newStopName.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {stopPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
          Agregar Paradero
        </button>
      </div>
    </div>
  );
}
