import type { LatLng } from "@/lib/geo";

export type NominatimSearchResult = {
  lat: string;
  lon: string;
  display_name?: string;
  name?: string;
  type?: string;
  class?: string;
  address?: Record<string, string>;
};

export type NominatimReverseResult = {
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

export const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "User-Agent": "EnquivaEventPlatform/1.0 (event-location)",
} as const;

export function cacheKey(coords: LatLng): string {
  return `${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`;
}

/** Keys in Nominatim `address` that represent a named place / POI. */
export const POI_ADDRESS_KEYS = [
  "amenity", "shop", "tourism", "leisure", "office", "craft",
  "healthcare", "building", "historic", "club", "university",
  "college", "school", "kindergarten", "library", "hospital",
  "clinic", "pharmacy", "place_of_worship", "supermarket",
  "convenience", "bakery", "cafe", "restaurant", "fast_food",
  "marketplace", "fuel", "bank", "atm",
] as const;

export const CATEGORY_LABEL_ES: Record<string, string> = {
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
