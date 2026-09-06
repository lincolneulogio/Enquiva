"use client";

import React from "react";
import type { EventScheduleSlot, TransportRoute } from "../types";
import { RegistrationModal } from "./RegistrationModal";

interface RegisterActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
  hasMultipleSchedules: boolean;
  schedules?: EventScheduleSlot[] | null;
  draft: any;
  isTransportAvailable: boolean;
  hasTransportEnabledWithoutRoutes: boolean;
  transportRoutes: TransportRoute[];
  hasCertificate: boolean;
  certificateTitle?: string | null;
  certificatePrice?: number | null;
  eventPrice: number;
  t: (key: string, params?: Record<string, any>) => string;
}

export function RegisterActionModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  hasMultipleSchedules,
  schedules,
  draft,
  isTransportAvailable,
  hasTransportEnabledWithoutRoutes,
  transportRoutes,
  hasCertificate,
  certificateTitle,
  certificatePrice,
  eventPrice,
  t,
}: RegisterActionModalProps) {
  return (
    <RegistrationModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      isPending={isPending}
      hasMultipleSchedules={hasMultipleSchedules}
      schedules={schedules}
      selectedScheduleId={draft.selectedScheduleId}
      onSelectSchedule={(id) => draft.setRegistrationValue("selectedScheduleId", id)}
      selectedSlot={draft.selectedSlot}
      isTransportAvailable={isTransportAvailable}
      hasTransportEnabledWithoutRoutes={hasTransportEnabledWithoutRoutes}
      transportRoutes={transportRoutes}
      wantsTransport={draft.wantsTransport}
      selectedRouteId={draft.selectedRouteId}
      selectedStopId={draft.selectedStopId}
      contactPhone={draft.contactPhone}
      onSetWantsTransport={(wants) => {
        if (!wants) {
          draft.setRegistrationValues((prev: any) => ({ ...prev, wantsTransport: false, seatsCount: 1 }));
        } else {
          draft.setRegistrationValue("wantsTransport", true);
        }
      }}
      onSelectRoute={(routeId) => {
        draft.setRegistrationValues((prev: any) => ({ ...prev, selectedRouteId: routeId, selectedStopId: "" }));
      }}
      onSelectStop={(stopId) => draft.setRegistrationValue("selectedStopId", stopId)}
      onChangeContactPhone={(phone) => draft.setRegistrationValue("contactPhone", phone)}
      seatsCount={draft.seatsCount}
      transportTotalCost={draft.transportTotalCost}
      guests={draft.guests}
      onChangeGuests={(newGuests) => draft.setRegistrationValue("guests", newGuests)}
      hasCertificate={hasCertificate}
      certificateTitle={certificateTitle}
      certificatePrice={certificatePrice}
      wantsCertificate={draft.wantsCertificate}
      onToggleCertificate={() => draft.setRegistrationValue("wantsCertificate", !draft.wantsCertificate)}
      eventPrice={eventPrice}
      consolidatedTotalCost={draft.consolidatedTotalCost}
      t={t}
    />
  );
}
