import { MapPin } from "lucide-react";
import { getIntlLocale } from "@/lib/i18n/core";
import type { Route } from "./types";

interface IntermediateStopsSelectorProps {
  route: Route;
  stopId: string;
  onStopChange: (stopId: string) => void;
  locale: "es" | "en";
  disabled?: boolean;
  inputClass: string;
}

export function IntermediateStopsSelector({
  route,
  stopId,
  onStopChange,
  locale,
  disabled = false,
  inputClass,
}: IntermediateStopsSelectorProps) {
  if (!route.stops || route.stops.length === 0) return null;

  const selectedStop = route.stops.find((s) => s.id === stopId);
  const hasCoords = selectedStop && selectedStop.latitude && selectedStop.longitude;
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${selectedStop.latitude},${selectedStop.longitude}`
    : "";
  const waUrl = hasCoords
    ? `https://wa.me/?text=${encodeURIComponent(`Paradero ${selectedStop.name}: ${mapsUrl}`)}`
    : "";

  return (
    <div className="sm:col-span-2 space-y-2">
      <label htmlFor="stopId" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        <MapPin className="h-4 w-4 text-primary" />
        Punto de Subida (Paradero Intermedio)
      </label>
      <select
        id="stopId"
        value={stopId}
        onChange={(e) => onStopChange(e.target.value)}
        disabled={disabled}
        className={inputClass}
      >
        <option value="">Punto de salida general por defecto ({route.departurePoint})</option>
        {route.stops.map((stop) => (
          <option key={stop.id} value={stop.id}>
            {stop.sortOrder != null ? `${stop.sortOrder}. ` : ""}
            {stop.name}
            {stop.estimatedArrivalTime
              ? ` · ETA ${new Date(stop.estimatedArrivalTime).toLocaleTimeString(getIntlLocale(locale), {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : ""}
          </option>
        ))}
      </select>

      {hasCoords && (
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-3.5 text-xs text-primary flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="min-w-0 flex-1">
            <p className="font-bold flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" /> Paradero: {selectedStop.name}
            </p>
            <p className="text-muted-foreground mt-0.5 leading-relaxed">
              Abre Maps o comparte la ubicación por WhatsApp.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-3 py-2 text-[10px] transition-all shadow-xs"
            >
              Cómo llegar
            </a>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold px-3 py-2 text-[10px]"
            >
              WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
