import { CATEGORY_LABEL_ES, POI_ADDRESS_KEYS } from "./types";

export function formatPlaceLabel(input: {
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

export function pickNamedPlace(
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

export function formatPoiTitle(
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

export function categoryLabel(raw?: string | null): string | null {
  if (!raw) return null;
  return CATEGORY_LABEL_ES[raw] ?? null;
}

export function formatStreetLine(address?: Record<string, string>): string | null {
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

export function formatLocalityLine(address?: Record<string, string>): string | null {
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
