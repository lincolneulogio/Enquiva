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
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
      >
        {geocoding ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Search className="h-3.5 w-3.5" />
        )}
        Buscar en mapa
      </button>
      <button
        type="button"
        onClick={onMyLocation}
        disabled={locating}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
      >
        {locating ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Crosshair className="h-3.5 w-3.5" />
        )}
        Usar mi ubicación
      </button>
      {hasPin && (
        <button
          type="button"
          onClick={onRemovePin}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          Quitar pin
        </button>
      )}
    </div>
  );
}
