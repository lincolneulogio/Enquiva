"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { LatLng } from "@/lib/geo";

export function FitBounds({
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

export function FlyTo({ target, zoom = 16 }: { target: LatLng | null; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], zoom, { duration: 0.6 });
  }, [target, zoom, map]);
  return null;
}

/** Keep map centered on the user while follow-me is active. */
export function FollowUser({
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
