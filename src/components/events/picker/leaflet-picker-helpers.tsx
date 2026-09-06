"use client";

import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import type { LatLng } from "@/lib/geo";

export function MapClickHandler({ onPick }: { onPick: (coords: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function MapInteractionGuard() {
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

export function Recenter({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], Math.max(map.getZoom(), 15), {
      animate: true,
    });
  }, [center.lat, center.lng, map]);
  return null;
}
