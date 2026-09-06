"use client";

import React from "react";
import { Bus, Check, Clock, X } from "lucide-react";
import type { TransportRoute } from "../../types";
import { TransportRouteSelector } from "../../transport/TransportRouteSelector";

interface TransportSelectionSectionProps {
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
  t: (key: string, params?: Record<string, any>) => string;
}

export function TransportSelectionSection({
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
  t,
}: TransportSelectionSectionProps) {
  return (
    <>
      {isTransportAvailable ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Bus className="h-4 w-4 text-primary" />
              {t("register.transportQuestion")}
            </label>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 text-[11px] font-semibold border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t("register.transportAvailableBadge")} ({transportRoutes.length}{" "}
              {transportRoutes.length === 1 ? "ruta" : "rutas"})
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("register.transportHelp")}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => onSetWantsTransport(true)}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 border font-medium transition-all ${
                wantsTransport
                  ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                  : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {wantsTransport && <Check className="h-4 w-4" />}
              {t("register.transportYes")}
            </button>
            <button
              type="button"
              onClick={() => onSetWantsTransport(false)}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 border font-medium transition-all ${
                !wantsTransport
                  ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                  : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {!wantsTransport && <Check className="h-4 w-4" />}
              {t("register.transportNo")}
            </button>
          </div>
        </div>
      ) : hasTransportEnabledWithoutRoutes ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-2 text-left animate-fadeIn">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Bus className="h-4 w-4 text-amber-500" />
              <span>{t("register.transportStatusTitle")}</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 text-[11px] font-semibold border border-amber-500/25">
              <Clock className="h-3 w-3" />
              {t("register.transportPendingRoutesBadge")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("register.transportPendingRoutesHelp")}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-2 text-left animate-fadeIn">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Bus className="h-4 w-4 text-muted-foreground" />
              <span>{t("register.transportStatusTitle")}</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-[11px] font-semibold border border-border">
              <X className="h-3 w-3" />
              {t("register.transportUnavailableBadge")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("register.transportNotAvailableHelp")}
          </p>
        </div>
      )}

      {isTransportAvailable && wantsTransport && (
        <TransportRouteSelector
          transportRoutes={transportRoutes}
          selectedRouteId={selectedRouteId}
          selectedStopId={selectedStopId}
          contactPhone={contactPhone}
          onSelectRoute={onSelectRoute}
          onSelectStop={onSelectStop}
          onChangeContactPhone={onChangeContactPhone}
          t={t}
        />
      )}
    </>
  );
}
