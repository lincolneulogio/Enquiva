"use client";

import React from "react";
import type { TransportRoute } from "../types";
import { TransportRouteCard } from "./TransportRouteCard";
import { TransportStopSelector } from "./TransportStopSelector";
import { TransportContactPhoneInput } from "./TransportContactPhoneInput";

interface TransportRouteSelectorProps {
  transportRoutes: TransportRoute[];
  selectedRouteId: string;
  selectedStopId: string;
  contactPhone: string;
  onSelectRoute: (routeId: string) => void;
  onSelectStop: (stopId: string) => void;
  onChangeContactPhone: (phone: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function TransportRouteSelector({
  transportRoutes,
  selectedRouteId,
  selectedStopId,
  contactPhone,
  onSelectRoute,
  onSelectStop,
  onChangeContactPhone,
  t,
}: TransportRouteSelectorProps) {
  const activeRoute = transportRoutes.find((r) => r.id === selectedRouteId);

  return (
    <div className="space-y-5 p-4 rounded-2xl bg-muted/40 border border-border/80 animate-slideDown">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
          {t("register.selectRouteLabel")}
        </label>
        <div className="grid gap-3 pt-1">
          {transportRoutes.map((route) => (
            <TransportRouteCard
              key={route.id}
              route={route}
              isSelected={selectedRouteId === route.id}
              onSelect={onSelectRoute}
              t={t}
            />
          ))}
        </div>
      </div>

      <TransportStopSelector
        activeRoute={activeRoute}
        selectedStopId={selectedStopId}
        onSelectStop={onSelectStop}
        t={t}
      />

      <TransportContactPhoneInput
        contactPhone={contactPhone}
        onChangeContactPhone={onChangeContactPhone}
        t={t}
      />
    </div>
  );
}
