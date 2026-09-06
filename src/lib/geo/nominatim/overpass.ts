import { haversineMeters, type LatLng } from "@/lib/geo";
import type { NearbyPoi } from "./types";

/**
 * Nearby named shops / amenities via Overpass (OSM).
 * Times out and rejects so callers can fall back to Nominatim.
 */
export async function fetchNearbyPois(
  coords: LatLng,
  radiusM: number,
  timeoutMs = 6000,
): Promise<NearbyPoi[]> {
  const q = `
[out:json][timeout:6];
(
  node(around:${radiusM},${coords.lat},${coords.lng})["name"]["amenity"];
  node(around:${radiusM},${coords.lat},${coords.lng})["name"]["shop"];
  node(around:${radiusM},${coords.lat},${coords.lng})["name"]["tourism"];
  node(around:${radiusM},${coords.lat},${coords.lng})["name"]["leisure"];
  node(around:${radiusM},${coords.lat},${coords.lng})["name"]["office"];
  node(around:${radiusM},${coords.lat},${coords.lng})["name"]["craft"];
  node(around:${radiusM},${coords.lat},${coords.lng})["name"]["healthcare"];
  node(around:${radiusM},${coords.lat},${coords.lng})["name"]["building"];
  way(around:${radiusM},${coords.lat},${coords.lng})["name"]["amenity"];
  way(around:${radiusM},${coords.lat},${coords.lng})["name"]["shop"];
  way(around:${radiusM},${coords.lat},${coords.lng})["name"]["tourism"];
  way(around:${radiusM},${coords.lat},${coords.lng})["name"]["leisure"];
  way(around:${radiusM},${coords.lat},${coords.lng})["name"]["office"];
  way(around:${radiusM},${coords.lat},${coords.lng})["name"]["building"];
  way(around:${radiusM},${coords.lat},${coords.lng})["name"]["healthcare"];
);
out center tags;
`.trim();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        Accept: "application/json",
      },
      body: `data=${encodeURIComponent(q)}`,
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Overpass ${res.status}`);

    const data = (await res.json()) as {
      elements?: Array<{
        type: string;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }>;
    };

    const pois: NearbyPoi[] = [];
    for (const el of data.elements ?? []) {
      const name = el.tags?.name?.trim();
      if (!name) continue;
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (lat == null || lng == null) continue;

      const category =
        el.tags?.amenity ||
        el.tags?.shop ||
        el.tags?.tourism ||
        el.tags?.leisure ||
        el.tags?.office ||
        el.tags?.craft ||
        el.tags?.healthcare ||
        el.tags?.building;

      pois.push({
        name,
        category,
        lat,
        lng,
        distanceM: haversineMeters(coords, { lat, lng }),
      });
    }

    return pois.sort((a, b) => a.distanceM - b.distanceM);
  } finally {
    clearTimeout(timer);
  }
}
