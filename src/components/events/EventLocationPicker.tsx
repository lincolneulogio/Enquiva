"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Marker as LeafletMarker } from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Check, Crosshair, Loader2, MapPinned, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";
import { DEFAULT_MAP_CENTER, type LatLng } from "@/lib/geo";
import {
  geocodeAddress,
  resolvePlace,
  type NearbyPoi,
} from "@/lib/geo/nominatim";
import {
  createPoiLocationIcon,
  useLeafletDefaultIcons,
} from "@/components/events/leaflet-icons";
import { cn } from "@/lib/utils";

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

function MapClickHandler({ onPick }: { onPick: (coords: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function MapInteractionGuard() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const stopPageScroll = (e: WheelEvent) => {
      e.preventDefault();
    };
    container.addEventListener("wheel", stopPageScroll, { passive: false });
    return () => container.removeEventListener("wheel", stopPageScroll);
  }, [map]);
  return null;
}

function Recenter({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], Math.max(map.getZoom(), 15), {
      animate: true,
    });
  }, [center.lat, center.lng, map]);
  return null;
}

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

  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [nearbyPoi, setNearbyPoi] = useState<NearbyPoi | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const reverseSeq = useRef(0);
  const poiIcon = useMemo(() => createPoiLocationIcon(), []);

  const center = useMemo(() => pin ?? DEFAULT_MAP_CENTER, [pin]);

  const syncAddressFromPin = useCallback(
    async (coords: LatLng) => {
      if (!onAddressChange) return;
      const seq = ++reverseSeq.current;
      setResolvingAddress(true);
      setAddressConfirmed(false);
      try {
        const resolved = await resolvePlace(coords);
        if (seq !== reverseSeq.current) return;
        if (resolved?.label) {
          onAddressChange(resolved.label);
          setNearbyPoi(resolved.poi);
          setConfirmOpen(true);
        } else if (address.trim()) {
          // Keep previous text; still ask confirmation
          setNearbyPoi(null);
          setConfirmOpen(true);
        }
      } catch {
        setNearbyPoi(null);
        if (address.trim()) setConfirmOpen(true);
      } finally {
        if (seq === reverseSeq.current) setResolvingAddress(false);
      }
    },
    [onAddressChange, address],
  );

  const pickPin = useCallback(
    (
      coords: LatLng,
      opts?: { skipReverse?: boolean; addressLabel?: string; poi?: NearbyPoi | null },
    ) => {
      onChange(coords);
      if (opts?.addressLabel) {
        onAddressChange?.(opts.addressLabel);
        setNearbyPoi(opts.poi ?? null);
        setConfirmOpen(true);
        setAddressConfirmed(false);
        return;
      }
      if (!opts?.skipReverse) {
        void syncAddressFromPin(coords);
      }
    },
    [onChange, onAddressChange, syncAddressFromPin],
  );

  const handleGeocode = useCallback(async () => {
    if (!address.trim()) {
      toast.error("Escribe una dirección antes de buscarla en el mapa.");
      return;
    }
    setGeocoding(true);
    try {
      const result = await geocodeAddress(address);
      if (!result) {
        toast.error("No se encontró esa dirección. Ajusta el pin manualmente.");
        return;
      }
      pickPin(result, { addressLabel: result.label });
      toast.success("Ubicación encontrada en el mapa.");
    } catch {
      toast.error("No se pudo buscar la dirección. Intenta de nuevo.");
    } finally {
      setGeocoding(false);
    }
  }, [address, pickPin]);

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        pickPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("Pin colocado en tu ubicación actual.");
      },
      () => {
        setLocating(false);
        toast.error("No se pudo obtener tu ubicación. Revisa los permisos.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }, [pickPin]);

  const showPoiMarker =
    nearbyPoi &&
    pin &&
    (Math.abs(nearbyPoi.lat - pin.lat) > 0.00005 ||
      Math.abs(nearbyPoi.lng - pin.lng) > 0.00005);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleGeocode}
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
          onClick={handleMyLocation}
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
        {pin && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setNearbyPoi(null);
              setConfirmOpen(false);
              setAddressConfirmed(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            Quitar pin
          </button>
        )}
      </div>

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
                <Marker
                  position={[nearbyPoi.lat, nearbyPoi.lng]}
                  icon={poiIcon}
                >
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

      {confirmOpen && address.trim() && !addressConfirmed && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
          <p className="text-xs font-medium text-foreground">
            ¿Es correcta esta ubicación?
          </p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {address}
            {nearbyPoi ? (
              <>
                {" "}
                · Lugar detectado: <strong className="text-foreground">{nearbyPoi.name}</strong>
                {nearbyPoi.distanceM > 0
                  ? ` (~${Math.round(nearbyPoi.distanceM)} m)`
                  : ""}
              </>
            ) : null}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Los datos vienen de OpenStreetMap; en Perú a veces falta el número o el nombre del local. Puedes editar el texto a mano.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setAddressConfirmed(true);
                setConfirmOpen(false);
                toast.success("Ubicación confirmada.");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              <Check className="h-3.5 w-3.5" />
              Sí, es correcto
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmOpen(false);
                onRequestEditAddress?.();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar dirección
            </button>
          </div>
        </div>
      )}

      {addressConfirmed && (
        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
          Dirección confirmada. Puedes seguir editándola si hace falta.
        </p>
      )}

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
