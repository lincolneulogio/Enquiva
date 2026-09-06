"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
} from "react-leaflet";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";
import {
  formatDistance,
  googleMapsDirectionsUrl,
  haversineMeters,
  type LatLng,
} from "@/lib/geo";
import {
  createUserLocationIcon,
  useLeafletDefaultIcons,
} from "@/components/events/leaflet-icons";
import { cn } from "@/lib/utils";
import {
  FitBounds,
  FollowUser,
  FlyTo,
  MapInteractionGuard,
  EventMapControls,
} from "./map";

type EventLocationMapProps = {
  latitude: number;
  longitude: number;
  locationLabel?: string | null;
  className?: string;
};

export function EventLocationMap({
  latitude,
  longitude,
  locationLabel,
  className,
}: EventLocationMapProps) {
  useLeafletDefaultIcons();

  const eventPoint = useMemo(
    () => ({ lat: latitude, lng: longitude }),
    [latitude, longitude],
  );

  const [userPoint, setUserPoint] = useState<LatLng | null>(null);
  const [tracking, setTracking] = useState(false);
  const [followMe, setFollowMe] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(null);
  const [directionsBusy, setDirectionsBusy] = useState(false);
  const [fitOnce, setFitOnce] = useState(true);
  const watchIdRef = useRef<number | null>(null);

  const userIcon = useMemo(() => createUserLocationIcon(), []);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
  }, []);

  const stopTracking = useCallback(() => {
    clearWatch();
    setTracking(false);
    setFollowMe(false);
  }, [clearWatch]);

  const startTracking = useCallback(
    (opts?: { follow?: boolean }) => {
      if (!navigator.geolocation) {
        setGeoError("Tu navegador no soporta geolocalización.");
        return;
      }
      setGeoError(null);
      setTracking(true);
      if (opts?.follow) setFollowMe(true);
      setFitOnce(true);

      clearWatch();
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setUserPoint({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setGeoError(null);
        },
        (err) => {
          setTracking(false);
          setFollowMe(false);
          if (err.code === err.PERMISSION_DENIED) {
            setGeoError("Permiso de ubicación denegado. El mapa del evento sigue disponible.");
          } else {
            setGeoError("No se pudo obtener tu ubicación en tiempo real.");
          }
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 },
      );
    },
    [clearWatch],
  );

  useEffect(() => {
    return () => clearWatch();
  }, [clearWatch]);

  useEffect(() => {
    if (userPoint && fitOnce && !followMe) {
      setFitOnce(false);
    }
  }, [userPoint, fitOnce, followMe]);

  const distanceLabel = useMemo(() => {
    if (!userPoint) return null;
    return formatDistance(haversineMeters(userPoint, eventPoint));
  }, [userPoint, eventPoint]);

  const openDirectionsWithGps = useCallback(() => {
    if (!navigator.geolocation) {
      window.open(googleMapsDirectionsUrl(eventPoint), "_blank", "noopener,noreferrer");
      return;
    }
    setDirectionsBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const origin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPoint(origin);
        setDirectionsBusy(false);
        window.open(googleMapsDirectionsUrl(eventPoint, origin), "_blank", "noopener,noreferrer");
      },
      () => {
        setDirectionsBusy(false);
        toast.message("Abriendo ruta sin GPS…", {
          description: "No se pudo leer tu ubicación; Google Maps pedirá el origen.",
        });
        window.open(googleMapsDirectionsUrl(eventPoint), "_blank", "noopener,noreferrer");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [eventPoint]);

  return (
    <div className={cn("space-y-3", className)}>
      <EventMapControls
        tracking={tracking}
        followMe={followMe}
        directionsBusy={directionsBusy}
        distanceLabel={distanceLabel}
        onStartTracking={startTracking}
        onStopTracking={stopTracking}
        onToggleFollow={() => {
          if (!tracking) startTracking({ follow: true });
          else setFollowMe((v) => !v);
        }}
        onCenterEvent={() => {
          setFollowMe(false);
          setFlyTarget({ ...eventPoint });
        }}
        onOpenDirections={openDirectionsWithGps}
      />

      {geoError && (
        <p className="text-xs text-amber-700 dark:text-amber-400">{geoError}</p>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-border/60">
        <MapContainer
          center={[eventPoint.lat, eventPoint.lng]}
          zoom={15}
          scrollWheelZoom
          touchZoom
          doubleClickZoom
          className="z-0 h-64 w-full touch-none overscroll-contain sm:h-72 [&_.leaflet-control-attribution]:text-[9px] [&_.leaflet-container]:touch-none"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapInteractionGuard />
          <FitBounds
            event={eventPoint}
            user={userPoint}
            enabled={!followMe && Boolean(userPoint) && fitOnce}
          />
          <FollowUser user={userPoint} active={followMe} />
          <FlyTo target={flyTarget} />
          <Marker position={[eventPoint.lat, eventPoint.lng]}>
            <Popup>{locationLabel?.trim() || "Ubicación del evento"}</Popup>
          </Marker>
          {userPoint && (
            <>
              <Marker position={[userPoint.lat, userPoint.lng]} icon={userIcon}>
                <Popup>Tu ubicación</Popup>
              </Marker>
              <Polyline
                positions={[
                  [userPoint.lat, userPoint.lng],
                  [eventPoint.lat, eventPoint.lng],
                ]}
                pathOptions={{
                  color: "#2563eb",
                  weight: 3,
                  opacity: 0.7,
                  dashArray: "6 8",
                }}
              />
            </>
          )}
        </MapContainer>

        {locationLabel && (
          <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1.5 rounded-xl border border-border/80 bg-white/95 dark:bg-card/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-xs">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="truncate max-w-[280px] sm:max-w-md">{locationLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
