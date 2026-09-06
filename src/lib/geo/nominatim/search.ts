import type { LatLng } from "@/lib/geo";
import {
  NOMINATIM_HEADERS,
  type NominatimReverseResult,
  type NominatimSearchResult,
  type PlaceSuggestion,
} from "./types";
import { formatPlaceLabel } from "./formatting";

export async function searchAddressSuggestions(
  query: string,
  limit = 6,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("namedetails", "1");
  url.searchParams.set("countrycodes", "pe");
  url.searchParams.set("accept-language", "es");

  const res = await fetch(url.toString(), {
    headers: NOMINATIM_HEADERS,
    signal,
  });
  if (!res.ok) return [];

  const data = (await res.json()) as NominatimSearchResult[];
  return data
    .map((item, index) => {
      const lat = Number(item.lat);
      const lng = Number(item.lon);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
      const label =
        formatPlaceLabel({
          name: item.name,
          className: item.class,
          type: item.type,
          address: item.address,
          displayName: item.display_name,
        }) ||
        item.display_name?.trim() ||
        trimmed;
      return {
        id: `${item.lat},${item.lon},${index}`,
        label,
        lat,
        lng,
      } satisfies PlaceSuggestion;
    })
    .filter((item): item is PlaceSuggestion => item != null);
}

export async function geocodeAddress(
  query: string,
): Promise<(LatLng & { label: string }) | null> {
  const suggestions = await searchAddressSuggestions(query, 1);
  const first = suggestions[0];
  if (!first) return null;
  return { lat: first.lat, lng: first.lng, label: first.label };
}

export async function fetchReverse(
  coords: LatLng,
  signal?: AbortSignal,
): Promise<NominatimReverseResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(coords.lat));
  url.searchParams.set("lon", String(coords.lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");
  url.searchParams.set("namedetails", "1");
  url.searchParams.set("accept-language", "es");

  const res = await fetch(url.toString(), {
    headers: NOMINATIM_HEADERS,
    signal,
  });
  if (!res.ok) return null;
  return (await res.json()) as NominatimReverseResult;
}

export async function reverseGeocode(coords: LatLng): Promise<string | null> {
  const data = await fetchReverse(coords);
  if (!data) return null;
  return (
    formatPlaceLabel({
      name: data.name || data.namedetails?.name,
      className: data.class,
      type: data.type,
      address: data.address,
      displayName: data.display_name,
    }) || null
  );
}
