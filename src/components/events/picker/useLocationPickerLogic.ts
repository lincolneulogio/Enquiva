"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { type LatLng } from "@/lib/geo";
import { geocodeAddress, resolvePlace, type NearbyPoi } from "@/lib/geo/nominatim";

interface UseLocationPickerLogicProps {
  address: string;
  onChange: (coords: LatLng | null) => void;
  onAddressChange?: (address: string) => void;
}

export function useLocationPickerLogic({
  address,
  onChange,
  onAddressChange,
}: UseLocationPickerLogicProps) {
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [nearbyPoi, setNearbyPoi] = useState<NearbyPoi | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const reverseSeq = useRef(0);

  const syncAddressFromPin = useCallback(
    async (coords: LatLng) => {
      if (!onAddressChange) return;
      const seq = ++reverseSeq.current;
      setResolvingAddress(true);
      setAddressConfirmed(false);
      try {
        const resolved = await resolvePlace(coords);
        if (seq !== reverseSeq.current) return;
        if (resolved?.label) {
          onAddressChange(resolved.label);
          setNearbyPoi(resolved.poi);
          setConfirmOpen(true);
        } else if (address.trim()) {
          setNearbyPoi(null);
          setConfirmOpen(true);
        }
      } catch {
        setNearbyPoi(null);
        if (address.trim()) setConfirmOpen(true);
      } finally {
        if (seq === reverseSeq.current) setResolvingAddress(false);
      }
    },
    [onAddressChange, address],
  );

  const pickPin = useCallback(
    (
      coords: LatLng,
      opts?: { skipReverse?: boolean; addressLabel?: string; poi?: NearbyPoi | null },
    ) => {
      onChange(coords);
      if (opts?.addressLabel) {
        onAddressChange?.(opts.addressLabel);
        setNearbyPoi(opts.poi ?? null);
        setConfirmOpen(true);
        setAddressConfirmed(false);
        return;
      }
      if (!opts?.skipReverse) {
        void syncAddressFromPin(coords);
      }
    },
    [onChange, onAddressChange, syncAddressFromPin],
  );

  const handleGeocode = useCallback(async () => {
    if (!address.trim()) {
      toast.error("Escribe una dirección antes de buscarla en el mapa.");
      return;
    }
    setGeocoding(true);
    try {
      const result = await geocodeAddress(address);
      if (!result) {
        toast.error("No se encontró esa dirección. Ajusta el pin manualmente.");
        return;
      }
      pickPin(result, { addressLabel: result.label });
      toast.success("Ubicación encontrada en el mapa.");
    } catch {
      toast.error("No se pudo buscar la dirección. Intenta de nuevo.");
    } finally {
      setGeocoding(false);
    }
  }, [address, pickPin]);

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        pickPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("Pin colocado en tu ubicación actual.");
      },
      () => {
        setLocating(false);
        toast.error("No se pudo obtener tu ubicación. Revisa los permisos.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }, [pickPin]);

  const removePin = useCallback(() => {
    onChange(null);
    setNearbyPoi(null);
    setConfirmOpen(false);
    setAddressConfirmed(false);
  }, [onChange]);

  return {
    geocoding,
    locating,
    resolvingAddress,
    nearbyPoi,
    confirmOpen,
    setConfirmOpen,
    addressConfirmed,
    setAddressConfirmed,
    pickPin,
    handleGeocode,
    handleMyLocation,
    removePin,
  };
}
