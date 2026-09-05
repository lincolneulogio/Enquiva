"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import {
  Crosshair,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  LocateFixed,
} from "lucide-react";
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

type EventLocationMapProps = {
  latitude: number;
  longitude: number;
  locationLabel?: string | null;
  className?: string;
};

function FitBounds({
  event,
  user,
  enabled,
}: {
  event: LatLng;
  user: LatLng | null;
  enabled: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (!enabled) return;
    if (user) {
      map.fitBounds(
        [
          [event.lat, event.lng],
          [user.lat, user.lng],
        ],
        { padding: [48, 48], maxZoom: 16, animate: true },
      );
    } else {
      map.setView([event.lat, event.lng], 15, { animate: true });
    }
  }, [event.lat, event.lng, user?.lat, user?.lng, map, user, enabled]);
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

function FlyTo({ target, zoom = 16 }: { target: LatLng | null; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], zoom, { duration: 0.6 });
  }, [target, zoom, map]);
  return null;
}

/** Keep map centered on the user while follow-me is active. */
function FollowUser({
  user,
  active,
}: {
  user: LatLng | null;
  active: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (!active || !user) return;
    map.panTo([user.lat, user.lng], { animate: true, duration: 0.4 });
  }, [active, user?.lat, user?.lng, map, user]);
  return null;
}

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
          const next = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserPoint(next);
          setGeoError(null);
        },
        (err) => {
          setTracking(false);
          setFollowMe(false);
          if (err.code === err.PERMISSION_DENIED) {
            setGeoError(
              "Permiso de ubicación denegado. El mapa del evento sigue disponible.",
            );
          } else {
            setGeoError("No se pudo obtener tu ubicación en tiempo real.");
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 3000,
          timeout: 15000,
        },
      );
    },
    [clearWatch],
  );

  useEffect(() => {
    return () => clearWatch();
  }, [clearWatch]);

  // After first GPS fix, fit both points once (unless follow-me owns the camera)
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
        const origin = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserPoint(origin);
        setDirectionsBusy(false);
        window.open(
          googleMapsDirectionsUrl(eventPoint, origin),
          "_blank",
          "noopener,noreferrer",
        );
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MapPin className="h-3.5 w-3.5" />
          </span>
          <h4 className="text-sm font-bold text-foreground">
            Mapa del lugar
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {!tracking ? (
            <button
              type="button"
              onClick={() => startTracking()}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-2xs hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              Mi ubicación en vivo
            </button>
          ) : (
            <button
              type="button"
              onClick={stopTracking}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              Detener
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (!tracking) {
                startTracking({ follow: true });
              } else {
                setFollowMe((v) => !v);
              }
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              followMe
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/80 bg-white dark:bg-card text-foreground/80 hover:bg-muted",
            )}
          >
            <LocateFixed className="h-3 w-3" />
            {followMe ? "Siguiéndote…" : "Seguirme"}
          </button>

          <button
            type="button"
            onClick={() => {
              setFollowMe(false);
              setFlyTarget({ ...eventPoint });
            }}
            className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-white dark:bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 hover:bg-muted transition-colors cursor-pointer"
          >
            <Crosshair className="h-3 w-3" />
            Centrar evento
          </button>

          <button
            type="button"
            onClick={openDirectionsWithGps}
            disabled={directionsBusy}
            className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-white dark:bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 hover:bg-muted transition-colors cursor-pointer disabled:opacity-60"
          >
            {directionsBusy ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ExternalLink className="h-3 w-3" />
            )}
            Cómo llegar
          </button>

          {distanceLabel && (
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              A {distanceLabel}
            </span>
          )}
        </div>
      </div>

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
