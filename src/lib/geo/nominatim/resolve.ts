import type { LatLng } from "@/lib/geo";
import {
  cacheKey,
  type NearbyPoi,
  type NominatimReverseResult,
  type ResolvedPlace,
} from "./types";
import {
  categoryLabel,
  formatLocalityLine,
  formatPoiTitle,
  formatStreetLine,
  pickNamedPlace,
} from "./formatting";
import { fetchNearbyPois } from "./overpass";
import { fetchReverse } from "./search";

const placeCache = new Map<string, ResolvedPlace>();

export async function resolvePlace(coords: LatLng): Promise<ResolvedPlace | null> {
  const key = cacheKey(coords);
  const cached = placeCache.get(key);

  let reverse: NominatimReverseResult | null = null;
  let nearby: NearbyPoi[] = [];
  let overpassOk = false;

  try {
    const reversePromise = fetchReverse(coords);
    const nearbyPromise = fetchNearbyPois(coords, 90, 6000).then(
      (pois) => {
        overpassOk = true;
        return pois;
      },
      () => [] as NearbyPoi[],
    );
    [reverse, nearby] = await Promise.all([reversePromise, nearbyPromise]);
  } catch {
    reverse = await fetchReverse(coords).catch(() => null);
  }

  if (!reverse && nearby.length === 0) {
    return cached ?? null;
  }

  const streetLine = reverse ? formatStreetLine(reverse.address) : null;
  const localityLine = reverse ? formatLocalityLine(reverse.address) : null;

  const reversePoiName =
    pickNamedPlace(reverse?.name, reverse?.namedetails, reverse?.address) ||
    (reverse?.class && reverse.class !== "highway" && reverse.class !== "place"
      ? reverse.name
      : null);

  const nearest = nearby[0] ?? null;
  const useNearby = nearest && nearest.distanceM <= 70;
  const poiName =
    (useNearby ? nearest!.name : null) ||
    reversePoiName ||
    (nearest ? nearest.name : null);

  const poiCategory =
    (useNearby ? nearest!.category : null) ||
    categoryLabel(reverse?.type) ||
    categoryLabel(reverse?.address?.amenity) ||
    categoryLabel(reverse?.address?.shop);

  const placeTitle = formatPoiTitle(poiName, categoryLabel(poiCategory) || poiCategory);

  const parts = [placeTitle, streetLine, localityLine].filter(
    (part, index, arr) =>
      Boolean(part) &&
      arr.findIndex((other) => other && other.toLowerCase() === part!.toLowerCase()) === index,
  );

  const label =
    parts.length > 0
      ? parts.join(", ")
      : reverse?.display_name?.trim() || cached?.label || null;

  if (!label) return cached ?? null;

  const poi =
    useNearby && nearest
      ? nearest
      : reversePoiName && reverse
        ? {
            name: reversePoiName,
            category: reverse.type || reverse.address?.amenity || reverse.address?.shop,
            lat: coords.lat,
            lng: coords.lng,
            distanceM: 0,
          }
        : nearest && nearest.distanceM <= 90
          ? nearest
          : null;

  const resolved: ResolvedPlace = {
    label,
    poi,
    source: overpassOk && nearby.length > 0 ? "overpass+nominatim" : "nominatim",
  };

  placeCache.set(key, resolved);
  return resolved;
}

export async function resolvePlaceLabel(coords: LatLng): Promise<string | null> {
  const resolved = await resolvePlace(coords);
  return resolved?.label ?? null;
}
