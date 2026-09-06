"use client";

import React from "react";
import { MapPin, Calendar } from "lucide-react";
import type { TransportRoute } from "../types";

interface TransportRouteCardProps {
  route: TransportRoute;
  isSelected: boolean;
  onSelect: (routeId: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function TransportRouteCard({
  route,
  isSelected,
  onSelect,
  t,
}: TransportRouteCardProps) {
  const formatRouteTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div
      onClick={() => onSelect(route.id)}
      className={`cursor-pointer rounded-xl border p-3.5 transition-all text-left flex flex-col gap-2 ${
        isSelected
          ? "border-primary bg-primary/10 dark:bg-primary/20 ring-1 ring-primary"
          : "border-border bg-card hover:border-muted-foreground/30"
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div>
          <span className="font-semibold text-sm text-foreground">{route.name}</span>
          {route.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{route.description}</p>
          )}
        </div>
        <span className="font-bold text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-lg shrink-0">
          {t("register.pricePerSeat", { price: Number(route.pricePerSeat).toFixed(2) })}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px]">
        <span className="rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 font-semibold">
          {route.availableSeats ?? route.totalSeats} asientos libres
        </span>
        <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
          {route.isRoundTrip === false ? "Solo ida" : "Ida y vuelta"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1.5 border-t border-border/40">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">
            <strong>{t("register.departureLabel")}</strong> {route.departurePoint}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>
            <strong>{t("register.departureTimeLabel")}</strong>{" "}
            {formatRouteTime(route.departureTime)}
          </span>
        </div>
      </div>
    </div>
  );
}
