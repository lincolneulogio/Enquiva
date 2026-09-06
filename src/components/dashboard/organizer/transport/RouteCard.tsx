"use client";

import React from "react";
import {
  MapPin,
  Clock,
  RefreshCw,
  Users,
  CreditCard,
  X,
  Check,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { getIntlLocale } from "@/lib/i18n/core";
import { Route, StopRow } from "./types";
import { StopsManager } from "./StopsManager";

interface RouteCardProps {
  route: Route;
  locale: "es" | "en";
  minDate: string;
  isPending: boolean;
  deletingId: string | null;
  eventPaymentMethods: Array<{ id: string; type: string; label: string; phone?: string | null; holderName: string }>;
  expandedRouteId: string | null;
  stopsByRoute: Record<string, StopRow[]>;
  newStopName: string;
  setNewStopName: (val: string) => void;
  newStopLat: number | null;
  setNewStopLat: (val: number | null) => void;
  newStopLng: number | null;
  setNewStopLng: (val: number | null) => void;
  newStopEtaDate: string;
  setNewStopEtaDate: (val: string) => void;
  newStopEtaClock: string;
  setNewStopEtaClock: (val: string) => void;
  newStopMaxSeats: string;
  setNewStopMaxSeats: (val: string) => void;
  stopPending: boolean;
  onToggleStops: (routeId: string) => void;
  onAddStop: (routeId: string) => void;
  onDeleteStop: (routeId: string, stopId: string) => void;
  onMoveStop: (routeId: string, index: number, direction: "up" | "down") => void;
  onToggleActive: (routeId: string, current: boolean) => void;
  onEdit: (route: Route) => void;
  onDelete: (routeId: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function RouteCard({
  route,
  locale,
  minDate,
  isPending,
  deletingId,
  eventPaymentMethods,
  expandedRouteId,
  stopsByRoute,
  newStopName,
  setNewStopName,
  newStopLat,
  setNewStopLat,
  newStopLng,
  setNewStopLng,
  newStopEtaDate,
  setNewStopEtaDate,
  newStopEtaClock,
  setNewStopEtaClock,
  newStopMaxSeats,
  setNewStopMaxSeats,
  stopPending,
  onToggleStops,
  onAddStop,
  onDeleteStop,
  onMoveStop,
  onToggleActive,
  onEdit,
  onDelete,
  t,
}: RouteCardProps) {
  const available = route.totalSeats - route.bookedSeats;
  const occupancy = Math.round((route.bookedSeats / route.totalSeats) * 100);

  return (
    <div
      className={`rounded-3xl border p-5 shadow-xs transition-opacity ${
        route.isActive ? "border-border bg-card" : "border-border/50 bg-muted/40 opacity-70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground text-lg leading-snug">{route.name}</h3>
            {!route.isActive && (
              <span className="rounded-full bg-muted border border-border/80 px-2.5 py-0.5 text-xs text-muted-foreground font-semibold">
                {t("transport.manager.inactive")}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span>{route.departurePoint}</span>
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground items-center leading-relaxed">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span>
                {t("transport.manager.departure")}:{" "}
                {new Date(route.departureTime).toLocaleString(getIntlLocale(locale), {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </span>
            {route.returnTime && (
              <span className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3 text-muted-foreground shrink-0" />
                <span>
                  {t("transport.manager.return")}:{" "}
                  {new Date(route.returnTime).toLocaleString(getIntlLocale(locale), {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </span>
            )}
            <span className="font-medium text-foreground">
              S/. {Number(route.pricePerSeat).toFixed(2)} / asiento{" "}
              ({route.isRoundTrip === false ? "Solo ida" : "Ida y vuelta"})
            </span>
            {(route.driverName || route.vehiclePlate) && (
              <span className="text-xs">
                {route.driverName ? `Chofer: ${route.driverName}` : ""}
                {route.driverName && route.vehiclePlate ? " · " : ""}
                {route.vehiclePlate ? `Placa: ${route.vehiclePlate}` : ""}
              </span>
            )}
            {Number(route.pricePerSeat) > 0 && eventPaymentMethods.length > 0 && (
              <span
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] text-primary font-bold shadow-3xs"
                title={locale === "en" ? "Available payments" : "Métodos de pago disponibles"}
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>{eventPaymentMethods.map((m) => m.label.toUpperCase()).join(" / ")}</span>
              </span>
            )}
          </div>

          {/* Occupancy bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 rounded-full bg-secondary">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  occupancy >= 90
                    ? "bg-destructive"
                    : occupancy >= 70
                    ? "bg-amber-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(occupancy, 100)}%` }}
              />
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
              <Users className="h-3 w-3" />
              {route.bookedSeats}/{route.totalSeats} ({available} {t("transport.manager.freeSeats")})
            </span>
          </div>

          {/* Paraderos Button */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => onToggleStops(route.id)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition-all cursor-pointer"
            >
              <MapPin className="h-3.5 w-3.5" />
              {expandedRouteId === route.id ? "Ocultar Paraderos" : "Gestionar Paraderos"}
            </button>
          </div>

          {/* Collapsible Stops Panel */}
          {expandedRouteId === route.id && (
            <StopsManager
              routeId={route.id}
              stops={stopsByRoute[route.id] || []}
              locale={locale}
              minDate={minDate}
              newStopName={newStopName}
              setNewStopName={setNewStopName}
              newStopLat={newStopLat}
              setNewStopLat={setNewStopLat}
              newStopLng={newStopLng}
              setNewStopLng={setNewStopLng}
              newStopEtaDate={newStopEtaDate}
              setNewStopEtaDate={setNewStopEtaDate}
              newStopEtaClock={newStopEtaClock}
              setNewStopEtaClock={setNewStopEtaClock}
              newStopMaxSeats={newStopMaxSeats}
              setNewStopMaxSeats={setNewStopMaxSeats}
              stopPending={stopPending}
              onAddStop={() => onAddStop(route.id)}
              onDeleteStop={(stopId) => onDeleteStop(route.id, stopId)}
              onMoveStop={(index, direction) => onMoveStop(route.id, index, direction)}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 md:justify-end">
          {/* Toggle Active Button */}
          <button
            type="button"
            onClick={() => onToggleActive(route.id, route.isActive)}
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-2xs hover:shadow-xs hover:translate-y-[-0.5px] active:translate-y-[0.5px] transition-all disabled:opacity-50 select-none cursor-pointer ${
              route.isActive
                ? "bg-destructive/5 text-destructive border-destructive/20 hover:bg-destructive/10 dark:bg-destructive/10 dark:border-destructive/30"
                : "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 dark:bg-primary/10 dark:border-primary/30"
            }`}
          >
            {route.isActive ? (
              <>
                <X className="h-3.5 w-3.5 text-destructive" />
                <span>{locale === "en" ? "Deactivate" : "Desactivar"}</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 text-primary" />
                <span>{locale === "en" ? "Activate" : "Activar"}</span>
              </>
            )}
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(route)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-2xs hover:shadow-xs hover:bg-secondary hover:translate-y-[-0.5px] active:translate-y-[0.5px] transition-all select-none cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{locale === "en" ? "Edit" : "Editar"}</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(route.id)}
            disabled={isPending && deletingId === route.id}
            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive shadow-2xs hover:shadow-xs hover:bg-destructive/10 hover:translate-y-[-0.5px] active:translate-y-[0.5px] transition-all disabled:opacity-50 select-none cursor-pointer"
          >
            {isPending && deletingId === route.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            <span>{locale === "en" ? "Delete" : "Eliminar"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
