/** Default map center (Lima, Peru). */
export const DEFAULT_MAP_CENTER = { lat: -12.0464, lng: -77.0428 } as const;

export type LatLng = { lat: number; lng: number };

/** Great-circle distance in meters (Haversine). */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(meters: number, locale = "es"): string {
  if (meters < 1000) {
    return locale.startsWith("en")
      ? `${Math.round(meters)} m`
      : `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  const rounded = km >= 10 ? Math.round(km) : Math.round(km * 10) / 10;
  return locale.startsWith("en") ? `${rounded} km` : `${rounded} km`;
}

export function googleMapsDirectionsUrl(dest: LatLng, origin?: LatLng | null): string {
  const destination = `${dest.lat},${dest.lng}`;
  if (origin) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

export function googleMapsPlaceUrl(point: LatLng): string {
  return `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`;
}
