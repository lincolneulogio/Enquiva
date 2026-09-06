/**
 * OpenStreetMap Nominatim & Overpass Geo Services
 * Re-exports from modularized sub-modules in @/lib/geo/nominatim/
 */
export type {
  NearbyPoi,
  PlaceSuggestion,
  ResolvedPlace,
} from "./nominatim/types";

export {
  formatPlaceLabel,
  pickNamedPlace,
  formatPoiTitle,
  categoryLabel,
  formatStreetLine,
  formatLocalityLine,
} from "./nominatim/formatting";

export { fetchNearbyPois } from "./nominatim/overpass";

export {
  searchAddressSuggestions,
  geocodeAddress,
  reverseGeocode,
} from "./nominatim/search";

export {
  resolvePlace,
  resolvePlaceLabel,
} from "./nominatim/resolve";
