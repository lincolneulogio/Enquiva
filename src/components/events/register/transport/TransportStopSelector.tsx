"use client";

import React from "react";
import type { TransportRoute } from "../types";

interface TransportStopSelectorProps {
  activeRoute?: TransportRoute;
  selectedStopId: string;
  onSelectStop: (stopId: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function TransportStopSelector({
  activeRoute,
  selectedStopId,
  onSelectStop,
  t,
}: TransportStopSelectorProps) {
  if (!activeRoute?.stops || activeRoute.stops.length === 0) {
    return null;
  }

  const selectedStop = activeRoute.stops.find((s) => s.id === selectedStopId);
  const hasCoordinates = Boolean(selectedStop?.latitude && selectedStop?.longitude);
  const mapsUrl = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${selectedStop!.latitude},${selectedStop!.longitude}`
    : "";
  const waUrl = hasCoordinates
    ? `https://wa.me/?text=${encodeURIComponent(`Paradero ${selectedStop!.name}: ${mapsUrl}`)}`
    : "";

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="register-stop-id"
        className="text-xs font-semibold text-foreground uppercase tracking-wider block"
      >
        {t("register.pickupStopOptional")}
      </label>
      <select
        id="register-stop-id"
        value={selectedStopId}
        onChange={(e) => onSelectStop(e.target.value)}
        className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value="">
          {t("register.generalDeparturePoint", { point: activeRoute.departurePoint })}
        </option>
        {[...activeRoute.stops]
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((stop, index) => (
            <option key={stop.id} value={stop.id}>
              {index + 1}. {stop.name}
              {stop.estimatedArrivalTime
                ? ` · ETA ${new Date(stop.estimatedArrivalTime).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`
                : ""}
              {stop.maxSeats != null ? ` (máx. ${stop.maxSeats})` : ""}
            </option>
          ))}
      </select>
      {hasCoordinates && (
        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            Cómo llegar (Maps)
          </a>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold text-emerald-600 hover:underline"
          >
            Compartir por WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
