"use client";

import React from "react";
import { createPortal } from "react-dom";
import type {
  EventScheduleSlot,
  TransportRoute,
  GuestInput,
} from "../types";
import { ScheduleSelectionSection } from "./sections/ScheduleSelectionSection";
import { TransportSelectionSection } from "./sections/TransportSelectionSection";
import { GuestsSelectionSection } from "./sections/GuestsSelectionSection";
import { CertificateSelectionSection } from "./sections/CertificateSelectionSection";
import { CostBreakdownSection } from "./sections/CostBreakdownSection";
import { RegistrationModalHeader } from "./RegistrationModalHeader";
import { RegistrationModalFooter } from "./RegistrationModalFooter";
import { useModalViewportLock } from "./useModalViewportLock";

export interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isPending: boolean;
  // Schedule props
  hasMultipleSchedules: boolean;
  schedules?: EventScheduleSlot[] | null;
  selectedScheduleId: string;
  onSelectSchedule: (scheduleId: string) => void;
  selectedSlot?: EventScheduleSlot | null;
  // Transport props
  isTransportAvailable: boolean;
  hasTransportEnabledWithoutRoutes: boolean;
  transportRoutes: TransportRoute[];
  wantsTransport: boolean;
  selectedRouteId: string;
  selectedStopId: string;
  contactPhone: string;
  onSetWantsTransport: (wants: boolean) => void;
  onSelectRoute: (routeId: string) => void;
  onSelectStop: (stopId: string) => void;
  onChangeContactPhone: (phone: string) => void;
  seatsCount: number;
  transportTotalCost: number;
  // Guests props
  guests: GuestInput[];
  onChangeGuests: (guests: GuestInput[]) => void;
  // Certificate props
  hasCertificate: boolean;
  certificateTitle?: string | null;
  certificatePrice?: number | null;
  wantsCertificate: boolean;
  onToggleCertificate: () => void;
  // Pricing & Breakdown props
  eventPrice: number;
  consolidatedTotalCost: number;
  t: (key: string, params?: Record<string, any>) => string;
}

export function RegistrationModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  hasMultipleSchedules,
  schedules,
  selectedScheduleId,
  onSelectSchedule,
  selectedSlot,
  isTransportAvailable,
  hasTransportEnabledWithoutRoutes,
  transportRoutes,
  wantsTransport,
  selectedRouteId,
  selectedStopId,
  contactPhone,
  onSetWantsTransport,
  onSelectRoute,
  onSelectStop,
  onChangeContactPhone,
  seatsCount,
  transportTotalCost,
  guests,
  onChangeGuests,
  hasCertificate,
  certificateTitle,
  certificatePrice,
  wantsCertificate,
  onToggleCertificate,
  eventPrice,
  consolidatedTotalCost,
  t,
}: RegistrationModalProps) {
  const { mounted, visualHeight } = useModalViewportLock(isOpen);

  if (!isOpen || !mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn">
      <div
        style={{ maxHeight: visualHeight }}
        className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scaleUp transition-[max-height] duration-200"
      >
        <RegistrationModalHeader onClose={onClose} t={t} />

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm flex-1" data-lenis-prevent>
          {hasMultipleSchedules && schedules && (
            <ScheduleSelectionSection
              schedules={schedules}
              selectedScheduleId={selectedScheduleId}
              onSelectSchedule={onSelectSchedule}
              t={t}
            />
          )}

          <TransportSelectionSection
            isTransportAvailable={isTransportAvailable}
            hasTransportEnabledWithoutRoutes={hasTransportEnabledWithoutRoutes}
            transportRoutes={transportRoutes}
            wantsTransport={wantsTransport}
            selectedRouteId={selectedRouteId}
            selectedStopId={selectedStopId}
            contactPhone={contactPhone}
            onSetWantsTransport={onSetWantsTransport}
            onSelectRoute={onSelectRoute}
            onSelectStop={onSelectStop}
            onChangeContactPhone={onChangeContactPhone}
            t={t}
          />

          <GuestsSelectionSection
            guests={guests}
            onChangeGuests={onChangeGuests}
            t={t}
          />

          <CertificateSelectionSection
            hasCertificate={hasCertificate}
            certificateTitle={certificateTitle}
            certificatePrice={certificatePrice}
            wantsCertificate={wantsCertificate}
            onToggleCertificate={onToggleCertificate}
          />

          <CostBreakdownSection
            hasMultipleSchedules={hasMultipleSchedules}
            selectedSlot={selectedSlot}
            eventPrice={eventPrice}
            guestsCount={guests.length}
            effectiveWantsTransport={Boolean(isTransportAvailable && wantsTransport)}
            seatsCount={seatsCount}
            transportTotalCost={transportTotalCost}
            effectiveWantsCertificate={Boolean(hasCertificate && wantsCertificate)}
            certificateTitle={certificateTitle}
            certificatePrice={certificatePrice}
            consolidatedTotalCost={consolidatedTotalCost}
            t={t}
          />
        </div>

        <RegistrationModalFooter
          onClose={onClose}
          onSubmit={onSubmit}
          isPending={isPending}
          t={t}
        />
      </div>
    </div>,
    document.body
  );
}
