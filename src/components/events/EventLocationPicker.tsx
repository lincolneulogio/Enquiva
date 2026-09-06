"use client";

import { useMemo } from "react";
import type { Marker as LeafletMarker } from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";
import { Loader2, MapPinned } from "lucide-react";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";
import { DEFAULT_MAP_CENTER, type LatLng } from "@/lib/geo";
import {
  createPoiLocationIcon,
  useLeafletDefaultIcons,
} from "@/components/events/leaflet-icons";
import { cn } from "@/lib/utils";
import {
  MapClickHandler,
  MapInteractionGuard,
  Recenter,
  LocationPickerToolbar,
  LocationConfirmBanner,
  useLocationPickerLogic,
} from "./picker";

type EventLocationPickerProps = {
  address: string;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  onChange: (coords: LatLng | null) => void;
  onAddressChange?: (address: string) => void;
  /** Focus the venue address field so the user can correct OSM gaps. */
  onRequestEditAddress?: () => void;
  className?: string;
};

export function EventLocationPicker({
  address,
  latitude,
  longitude,
  onChange,
  onAddressChange,
  onRequestEditAddress,
  className,
}: EventLocationPickerProps) {
  useLeafletDefaultIcons();

  const hasPin =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude);

  const pin: LatLng | null = hasPin
    ? { lat: latitude!, lng: longitude! }
    : null;

  const poiIcon = useMemo(() => createPoiLocationIcon(), []);
  const center = useMemo(() => pin ?? DEFAULT_MAP_CENTER, [pin]);

  const {
    geocoding,
    locating,
    resolvingAddress,
    nearbyPoi,
    confirmOpen,
    setConfirmOpen,
    addressConfirmed,
    setAddressConfirmed,
    pickPin,
    handleGeocode,
    handleMyLocation,
    removePin,
  } = useLocationPickerLogic({
    address,
    onChange,
    onAddressChange,
  });

  const showPoiMarker =
    nearbyPoi &&
    pin &&
    (Math.abs(nearbyPoi.lat - pin.lat) > 0.00005 ||
      Math.abs(nearbyPoi.lng - pin.lng) > 0.00005);

  return (
    <div className={cn("space-y-2", className)}>
      <LocationPickerToolbar
        geocoding={geocoding}
        locating={locating}
        hasPin={Boolean(pin)}
        onGeocode={handleGeocode}
        onMyLocation={handleMyLocation}
        onRemovePin={removePin}
      />

      <div className="overflow-hidden rounded-xl border border-border">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={pin ? 15 : 12}
          scrollWheelZoom
          touchZoom
          doubleClickZoom
          className="z-0 h-56 w-full touch-none overscroll-contain [&_.leaflet-control-attribution]:text-[9px] [&_.leaflet-container]:touch-none"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapInteractionGuard />
          <MapClickHandler onPick={(coords) => pickPin(coords)} />
          {pin && (
            <>
              <Recenter center={pin} />
              <Marker
                position={[pin.lat, pin.lng]}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const m = e.target as LeafletMarker;
                    const { lat, lng } = m.getLatLng();
                    pickPin({ lat, lng });
                  },
                }}
              >
                <Popup>Pin del evento</Popup>
              </Marker>
              {showPoiMarker && nearbyPoi && (
                <Marker position={[nearbyPoi.lat, nearbyPoi.lng]} icon={poiIcon}>
                  <Popup>
                    {nearbyPoi.name}
                    {nearbyPoi.category ? ` (${nearbyPoi.category})` : ""}
                  </Popup>
                </Marker>
              )}
            </>
          )}
        </MapContainer>
      </div>

      <LocationConfirmBanner
        address={address}
        nearbyPoi={nearbyPoi}
        confirmOpen={confirmOpen}
        addressConfirmed={addressConfirmed}
        onConfirm={() => {
          setAddressConfirmed(true);
          setConfirmOpen(false);
          toast.success("Ubicación confirmada.");
        }}
        onEditAddress={() => {
          setConfirmOpen(false);
          onRequestEditAddress?.();
        }}
      />

      <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <MapPinned className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {resolvingAddress ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            Actualizando dirección del pin…
          </span>
        ) : pin ? (
          `Pin: ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}. La estrella ámbar marca el lugar cercano detectado.`
        ) : (
          "Escribe con sugerencias, usa tu GPS o haz clic en el mapa para fijar el pin."
        )}
      </p>
    </div>
  );
}
