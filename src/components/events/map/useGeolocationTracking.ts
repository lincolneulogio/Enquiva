"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  formatDistance,
  googleMapsDirectionsUrl,
  haversineMeters,
  type LatLng,
} from "@/lib/geo";

export function useGeolocationTracking(eventPoint: LatLng) {
  const [userPoint, setUserPoint] = useState<LatLng | null>(null);
  const [tracking, setTracking] = useState(false);
  const [followMe, setFollowMe] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [directionsBusy, setDirectionsBusy] = useState(false);
  const [fitOnce, setFitOnce] = useState(true);
  const watchIdRef = useRef<number | null>(null);

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

  return {
    userPoint,
    tracking,
    followMe,
    setFollowMe,
    geoError,
    directionsBusy,
    fitOnce,
    distanceLabel,
    startTracking,
    stopTracking,
    openDirectionsWithGps,
  };
}
