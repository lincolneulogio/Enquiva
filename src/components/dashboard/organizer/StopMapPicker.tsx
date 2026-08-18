"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { LatLng } from "@/lib/geo";

const EventLocationPickerInner = dynamic(
  () =>
    import("@/components/events/EventLocationPicker").then(
      (m) => m.EventLocationPicker,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-muted/30 text-xs text-muted-foreground">
        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        Cargando mapa…
      </div>
    ),
  },
);

type StopMapPickerProps = {
  address: string;
  latitude: number | null;
  longitude: number | null;
  onAddressChange: (address: string) => void;
  onCoordsChange: (coords: LatLng | null) => void;
};

export function StopMapPicker({
  address,
  latitude,
  longitude,
  onAddressChange,
  onCoordsChange,
}: StopMapPickerProps) {
  return (
    <EventLocationPickerInner
      address={address}
      latitude={latitude}
      longitude={longitude}
      onChange={onCoordsChange}
      onAddressChange={onAddressChange}
      className="mt-1"
    />
  );
}
