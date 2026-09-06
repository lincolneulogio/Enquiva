"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X, Loader2 } from "lucide-react";
import {
  EventScheduleSlot,
  TransportRoute,
  GuestInput,
} from "./types";
import { ScheduleSelectionSection } from "./ScheduleSelectionSection";
import { TransportSelectionSection } from "./TransportSelectionSection";
import { GuestsSelectionSection } from "./GuestsSelectionSection";
import { CertificateSelectionSection } from "./CertificateSelectionSection";
import { CostBreakdownSection } from "./CostBreakdownSection";

interface RegistrationModalProps {
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
  const [mounted, setMounted] = useState(false);
  const [visualHeight, setVisualHeight] = useState("90vh");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Dynamic visual viewport height adjustment (e.g. when keyboard opens on mobile)
  useEffect(() => {
    if (!isOpen || typeof window === "undefined" || !window.visualViewport) return;

    const handleResize = () => {
      const vv = window.visualViewport;
      if (vv) {
        setVisualHeight(`${vv.height * 0.92}px`);
      }
    };

    window.visualViewport.addEventListener("resize", handleResize);
    window.visualViewport.addEventListener("scroll", handleResize);
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
    };
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (isOpen) {
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      if (typeof window !== "undefined" && window.__enquivaLenis) {
        window.__enquivaLenis.stop();
      }
    } else {
      html.style.overflow = "";
      body.style.overflow = "";
      if (typeof window !== "undefined" && window.__enquivaLenis) {
        window.__enquivaLenis.start();
      }
    }
    return () => {
      html.style.overflow = "";
      body.style.overflow = "";
      if (typeof window !== "undefined" && window.__enquivaLenis) {
        window.__enquivaLenis.start();
      }
    };
  }, [isOpen]);

  if (!isOpen || !mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn">
      <div
        style={{ maxHeight: visualHeight }}
        className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scaleUp transition-[max-height] duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-base">{t("register.modalTitle")}</h3>
              <p className="text-xs text-muted-foreground">{t("register.modalSubtitle")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm flex-1" data-lenis-prevent>
          {/* Schedule Selection */}
          {hasMultipleSchedules && schedules && (
            <ScheduleSelectionSection
              schedules={schedules}
              selectedScheduleId={selectedScheduleId}
              onSelectSchedule={onSelectSchedule}
              t={t}
            />
          )}

          {/* Transport Selection */}
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

          {/* Guest Tickets Selection */}
          <GuestsSelectionSection
            guests={guests}
            onChangeGuests={onChangeGuests}
            t={t}
          />

          {/* Certificate Add-on */}
          <CertificateSelectionSection
            hasCertificate={hasCertificate}
            certificateTitle={certificateTitle}
            certificatePrice={certificatePrice}
            wantsCertificate={wantsCertificate}
            onToggleCertificate={onToggleCertificate}
          />

          {/* Cost Breakdown */}
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

        {/* Footer */}
        <div className="p-5 border-t border-border bg-muted/30 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-border hover:bg-muted text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            disabled={isPending}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending}
            className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("register.confirmRegistration")
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
