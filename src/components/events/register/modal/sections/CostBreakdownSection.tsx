"use client";

import React from "react";
import { Info, Award } from "lucide-react";
import type { EventScheduleSlot } from "../../types";

interface CostBreakdownSectionProps {
  hasMultipleSchedules: boolean;
  selectedSlot?: EventScheduleSlot | null;
  eventPrice: number;
  guestsCount: number;
  effectiveWantsTransport: boolean;
  seatsCount: number;
  transportTotalCost: number;
  effectiveWantsCertificate: boolean;
  certificateTitle?: string | null;
  certificatePrice?: number | null;
  consolidatedTotalCost: number;
  t: (key: string, params?: Record<string, any>) => string;
}

export function CostBreakdownSection({
  hasMultipleSchedules,
  selectedSlot,
  eventPrice,
  guestsCount,
  effectiveWantsTransport,
  seatsCount,
  transportTotalCost,
  effectiveWantsCertificate,
  certificateTitle,
  certificatePrice,
  consolidatedTotalCost,
  t,
}: CostBreakdownSectionProps) {
  return (
    <>
      {consolidatedTotalCost > 0 && (
        <div className="rounded-xl bg-primary/5 border border-primary/15 p-3.5 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs text-muted-foreground text-left">
            <p className="font-semibold text-foreground">{t("register.unifiedPaymentTitle")}</p>
            <p className="leading-relaxed">{t("register.unifiedPaymentHelp")}</p>
          </div>
        </div>
      )}

      <div className="border-t border-border pt-4 space-y-2.5 text-left">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
          {t("register.consolidatedBreakdown")}
        </span>

        <div className="space-y-1.5 text-xs text-muted-foreground">
          {hasMultipleSchedules && selectedSlot && (
            <div className="flex justify-between items-center animate-fadeIn">
              <span>{t("register.scheduleSlotBadge")}</span>
              <span className="font-semibold text-primary">
                {selectedSlot.label || "Turno Seleccionado"}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span>
              {t("register.ticketCostLabel", {
                paidLabel: eventPrice > 0 ? t("register.paidTicket") : t("register.freeTicket"),
                guestsSuffix: guestsCount > 0 ? ` x ${1 + guestsCount}` : "",
              })}
            </span>
            <span className="font-medium text-foreground">
              {eventPrice > 0
                ? `S/ ${(eventPrice * (1 + guestsCount)).toFixed(2)}`
                : t("register.free")}
            </span>
          </div>

          {effectiveWantsTransport && (
            <div className="flex justify-between animate-fadeIn">
              <span>
                {t("register.transportSeatsLabel", {
                  count: seatsCount,
                  plural: seatsCount > 1 ? "s" : "",
                })}
              </span>
              <span className="font-medium text-foreground">
                {transportTotalCost > 0
                  ? `S/ ${transportTotalCost.toFixed(2)}`
                  : t("register.free")}
              </span>
            </div>
          )}

          {effectiveWantsCertificate && (
            <div className="flex justify-between items-center animate-fadeIn">
              <span className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{certificateTitle || "Certificado Oficial"}</span>
              </span>
              <span className="font-medium text-foreground">
                {Number(certificatePrice) > 0
                  ? `S/ ${Number(certificatePrice).toFixed(2)}`
                  : t("register.free")}
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm text-foreground font-semibold pt-2 border-t border-dashed border-border">
            <span className="flex items-center gap-1">
              {t("register.consolidatedTotal")}
            </span>
            <span className="text-primary text-base font-bold bg-primary/5 px-2.5 py-0.5 rounded-lg">
              {consolidatedTotalCost > 0
                ? `S/ ${consolidatedTotalCost.toFixed(2)}`
                : t("register.free")}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
