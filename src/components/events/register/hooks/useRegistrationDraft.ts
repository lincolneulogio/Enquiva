"use client";

import { useEffect } from "react";
import { usePersistedFormFields } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import type { EventScheduleSlot, TransportRoute, GuestInput } from "../types";

interface UseRegistrationDraftProps {
  eventId: string;
  schedules?: EventScheduleSlot[] | null;
  transportRoutes?: TransportRoute[];
  isTransportAvailable: boolean;
  hasCertificate: boolean;
  certificatePrice?: number | null;
  eventPrice: number;
}

export function useRegistrationDraft({
  eventId,
  schedules,
  transportRoutes = [],
  isTransportAvailable,
  hasCertificate,
  certificatePrice = 0,
  eventPrice,
}: UseRegistrationDraftProps) {
  const {
    values: registrationDraft,
    setValue: setRegistrationValue,
    setValues: setRegistrationValues,
    clear: clearRegistrationDraft,
  } = usePersistedFormFields(
    formStorageKey(`event.register.${eventId}`),
    {
      selectedScheduleId: schedules && schedules.length > 0 ? schedules[0].id : "",
      wantsTransport: false,
      selectedRouteId: "",
      selectedStopId: "",
      seatsCount: 1,
      contactPhone: "",
      guests: [] as GuestInput[],
      wantsCertificate: false,
    },
  );

  const {
    selectedScheduleId,
    wantsTransport,
    selectedRouteId,
    selectedStopId,
    seatsCount,
    contactPhone,
    guests,
    wantsCertificate,
  } = registrationDraft;

  useEffect(() => {
    if (schedules && schedules.length > 0 && !schedules.some((s) => s.id === selectedScheduleId)) {
      setRegistrationValue("selectedScheduleId", schedules[0].id);
    }
  }, [schedules, selectedScheduleId, setRegistrationValue]);

  useEffect(() => {
    if (!isTransportAvailable && wantsTransport) {
      setRegistrationValue("wantsTransport", false);
    }
  }, [isTransportAvailable, wantsTransport, setRegistrationValue]);

  useEffect(() => {
    setRegistrationValue("seatsCount", 1 + guests.length);
  }, [guests.length, setRegistrationValue]);

  useEffect(() => {
    if (transportRoutes.length > 0 && !selectedRouteId) {
      setRegistrationValue("selectedRouteId", transportRoutes[0].id);
    }
  }, [transportRoutes, selectedRouteId, setRegistrationValue]);

  const effectiveScheduleId = selectedScheduleId || (schedules && schedules[0]?.id) || "";
  const selectedSlot = schedules?.find((s) => s.id === effectiveScheduleId);
  const activeRoute = isTransportAvailable ? transportRoutes.find((r) => r.id === selectedRouteId) : undefined;
  const transportPricePerSeat = activeRoute ? Number(activeRoute.pricePerSeat) : 0;
  const effectiveWantsTransport = Boolean(isTransportAvailable && wantsTransport);
  const transportTotalCost = effectiveWantsTransport ? transportPricePerSeat * seatsCount : 0;
  const effectiveWantsCertificate = Boolean(hasCertificate && wantsCertificate);
  const certificateTotalCost = effectiveWantsCertificate ? Number(certificatePrice || 0) : 0;
  const consolidatedTotalCost = (eventPrice * (1 + guests.length)) + transportTotalCost + certificateTotalCost;

  return {
    registrationDraft,
    setRegistrationValue,
    setRegistrationValues,
    clearRegistrationDraft,
    effectiveScheduleId,
    selectedSlot,
    effectiveWantsTransport,
    transportTotalCost,
    effectiveWantsCertificate,
    consolidatedTotalCost,
    selectedScheduleId,
    wantsTransport,
    selectedRouteId,
    selectedStopId,
    seatsCount,
    contactPhone,
    guests,
    wantsCertificate,
  };
}
