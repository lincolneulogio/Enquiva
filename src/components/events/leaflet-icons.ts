"use client";

import { useEffect } from "react";
import L from "leaflet";

let iconsConfigured = false;

/** Fix broken default marker paths under Next.js bundling. */
export function useLeafletDefaultIcons() {
  useEffect(() => {
    if (iconsConfigured) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
    iconsConfigured = true;
  }, []);
}

export function createUserLocationIcon() {
  return L.divIcon({
    className: "enquiva-user-location-icon",
    html: `<span style="
      display:block;width:16px;height:16px;border-radius:9999px;
      background:#2563eb;border:3px solid #fff;
      box-shadow:0 0 0 2px rgba(37,99,235,.35),0 1px 4px rgba(0,0,0,.25);
    "></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

/** Amber pin for nearby POI confirmation (shop, school, bakery…). */
export function createPoiLocationIcon() {
  return L.divIcon({
    className: "enquiva-poi-location-icon",
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:28px;height:28px;border-radius:9999px;
      background:#f59e0b;border:2px solid #fff;color:#fff;
      font-size:14px;font-weight:700;line-height:1;
      box-shadow:0 1px 6px rgba(0,0,0,.28);
    ">★</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}
