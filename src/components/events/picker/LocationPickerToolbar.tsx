"use client";

import { Crosshair, Loader2, Search } from "lucide-react";

interface LocationPickerToolbarProps {
  geocoding: boolean;
  locating: boolean;
  hasPin: boolean;
  onGeocode: () => void;
  onMyLocation: () => void;
  onRemovePin: () => void;
}

export function LocationPickerToolbar({
  geocoding,
  locating,
  hasPin,
  onGeocode,
  onMyLocation,
  onRemovePin,
}: LocationPickerToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onGeocode}
        disabled={geocoding}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/90 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-2xs hover:border-primary/40 hover:bg-muted/40 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
      >
        {geocoding ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Search className="h-3.5 w-3.5 text-primary" />
        )}
        Buscar en mapa
      </button>
      <button
        type="button"
        onClick={onMyLocation}
        disabled={locating}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/90 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-2xs hover:border-primary/40 hover:bg-muted/40 transition-all cursor-pointer active:scale-95 disabled:opacity-60"
      >
        {locating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Crosshair className="h-3.5 w-3.5 text-primary" />
        )}
        Usar mi ubicación
      </button>
      {hasPin && (
        <button
          type="button"
          onClick={onRemovePin}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 px-3.5 py-1.5 text-xs font-semibold text-destructive/80 hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-all cursor-pointer active:scale-95 shadow-2xs"
        >
          Quitar pin
        </button>
      )}
    </div>
  );
}
