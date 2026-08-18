import { haversineMeters, type LatLng } from "@/lib/geo";

type NominatimSearchResult = {
  lat: string;
  lon: string;
  display_name?: string;
  name?: string;
  type?: string;
  class?: string;
  address?: Record<string, string>;
};

type NominatimReverseResult = {
  display_name?: string;
  name?: string;
  type?: string;
  class?: string;
  address?: Record<string, string>;
  extratags?: Record<string, string>;
  namedetails?: Record<string, string>;
};

export type NearbyPoi = {
  name: string;
  category?: string;
  lat: number;
  lng: number;
  distanceM: number;
};

export type PlaceSuggestion = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

export type ResolvedPlace = {
  label: string;
  poi: NearbyPoi | null;
  source: "overpass+nominatim" | "nominatim" | "cache";
};

const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "User-Agent": "EnquivaEventPlatform/1.0 (event-location)",
} as const;

const placeCache = new Map<string, ResolvedPlace>();

function cacheKey(coords: LatLng): string {
  return `${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`;
}

/** Keys in Nominatim `address` that represent a named place / POI. */
const POI_ADDRESS_KEYS = [
  "amenity",
  "shop",
  "tourism",
  "leisure",
  "office",
  "craft",
  "healthcare",
  "building",
  "historic",
  "club",
  "university",
  "college",
  "school",
  "kindergarten",
  "library",
  "hospital",
  "clinic",
  "pharmacy",
  "place_of_worship",
  "supermarket",
  "convenience",
  "bakery",
  "cafe",
  "restaurant",
  "fast_food",
  "marketplace",
  "fuel",
  "bank",
  "atm",
] as const;

const CATEGORY_LABEL_ES: Record<string, string> = {
  school: "Colegio",
  university: "Universidad",
  college: "Instituto",
  kindergarten: "Inicial",
  library: "Biblioteca",
  hospital: "Hospital",
  clinic: "Clínica",
  doctors: "Consultorio",
  pharmacy: "Farmacia",
  bakery: "Panadería",
  convenience: "Bodega",
  supermarket: "Supermercado",
  hardware: "Ferretería",
  doityourself: "Ferretería",
  greengrocer: "Verdulería",
  butcher: "Carnicería",
  clothes: "Tienda",
  mall: "Centro comercial",
  marketplace: "Mercado",
  restaurant: "Restaurante",
  cafe: "Café",
  fast_food: "Comidas",
  bar: "Bar",
  bank: "Banco",
  atm: "Cajero",
  fuel: "Grifo",
  place_of_worship: "Templo",
  church: "Iglesia",
  community_centre: "Local comunal",
  theatre: "Teatro",
  cinema: "Cine",
  museum: "Museo",
  park: "Parque",
  stadium: "Estadio",
  sports_centre: "Centro deportivo",
  hotel: "Hotel",
  hostel: "Hostal",
  police: "Comisaría",
  fire_station: "Bomberos",
  townhall: "Municipalidad",
  post_office: "Correo",
  parking: "Estacionamiento",
  bus_station: "Terminal",
};

/**
 * Autocomplete suggestions while typing an address (Nominatim).
 */
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
  // Bias toward Peru / LatAm without hard-bounding results
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

/**
 * Geocode an address via OpenStreetMap Nominatim (no API key).
 */
export async function geocodeAddress(
  query: string,
): Promise<(LatLng & { label: string }) | null> {
  const suggestions = await searchAddressSuggestions(query, 1);
  const first = suggestions[0];
  if (!first) return null;
  return { lat: first.lat, lng: first.lng, label: first.label };
}

/**
 * Reverse-geocode coordinates to a human-readable address (street + number).
 */
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

/**
 * Resolve place label + optional nearby POI.
 * Overpass may fail/timeout → falls back to Nominatim and last cache.
 */
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
      arr.findIndex(
        (other) => other && other.toLowerCase() === part!.toLowerCase(),
      ) === index,
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

/** @deprecated Prefer resolvePlace — kept for simple label-only callers. */
export async function resolvePlaceLabel(coords: LatLng): Promise<string | null> {
  const resolved = await resolvePlace(coords);
  return resolved?.label ?? null;
}

async function fetchReverse(
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

/**
 * Nearby named shops / amenities via Overpass (OSM).
 * Times out and rejects so callers can fall back to Nominatim.
 */
async function fetchNearbyPois(
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

function formatPlaceLabel(input: {
  name?: string | null;
  className?: string | null;
  type?: string | null;
  address?: Record<string, string>;
  displayName?: string | null;
}): string | null {
  const poiName = pickNamedPlace(input.name, undefined, input.address);
  const title = formatPoiTitle(
    poiName,
    categoryLabel(input.type) ||
      categoryLabel(input.address?.amenity) ||
      categoryLabel(input.address?.shop),
  );
  const street = formatStreetLine(input.address);
  const locality = formatLocalityLine(input.address);
  const parts = [title, street, locality].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return input.displayName?.trim() || null;
}

function pickNamedPlace(
  name?: string | null,
  namedetails?: Record<string, string>,
  address?: Record<string, string>,
): string | null {
  const fromDetails = namedetails?.name?.trim();
  if (fromDetails) return fromDetails;
  if (name?.trim()) return name.trim();
  if (!address) return null;
  for (const key of POI_ADDRESS_KEYS) {
    const value = address[key]?.trim();
    if (
      value &&
      !CATEGORY_LABEL_ES[value] &&
      value.length > 2 &&
      !/^[a-z_]+$/.test(value)
    ) {
      return value;
    }
  }
  return null;
}

function formatPoiTitle(
  name: string | null | undefined,
  category: string | null | undefined,
): string | null {
  const n = name?.trim();
  if (!n) return null;
  if (!category) return n;
  const cat = category.trim();
  if (!cat) return n;
  if (n.toLowerCase().includes(cat.toLowerCase())) return n;
  return `${cat} ${n}`;
}

function categoryLabel(raw?: string | null): string | null {
  if (!raw) return null;
  return CATEGORY_LABEL_ES[raw] ?? null;
}

function formatStreetLine(address?: Record<string, string>): string | null {
  if (!address) return null;
  const road =
    address.road ||
    address.pedestrian ||
    address.footway ||
    address.path ||
    address.residential ||
    address.neighbourhood;
  if (!road) return null;

  const house =
    address.house_number ||
    address.housenumber ||
    address["addr:housenumber"];

  if (house) return `${road} ${house}`.trim();
  return road.trim();
}

function formatLocalityLine(address?: Record<string, string>): string | null {
  if (!address) return null;
  const suburb =
    address.suburb ||
    address.neighbourhood ||
    address.quarter ||
    address.city_district ||
    address.borough;
  const locality =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county;
  const state = address.state;

  const parts: string[] = [];
  if (suburb && suburb !== locality) parts.push(suburb);
  if (locality) parts.push(locality);
  if (state && state !== locality) parts.push(state);
  return parts.length > 0 ? parts.join(", ") : null;
}
