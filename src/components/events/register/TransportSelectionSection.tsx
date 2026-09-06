"use client";

import React from "react";
import { Bus, Check, Clock, X, MapPin, Calendar } from "lucide-react";
import { TransportRoute } from "./types";

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
  const activeRoute = isTransportAvailable
    ? transportRoutes.find((r) => r.id === selectedRouteId)
    : undefined;

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
    <>
      {/* Transport Availability & Options Section */}
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
        /* Transporte habilitado por el organizador pero sin rutas activas */
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
        /* No cuenta con servicio de transporte oficial */
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

      {/* Dynamic Interactive Transport Section */}
      {isTransportAvailable && wantsTransport && (
        <div className="space-y-5 p-4 rounded-2xl bg-muted/40 border border-border/80 animate-slideDown">
          {/* Route Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
              {t("register.selectRouteLabel")}
            </label>
            <div className="grid gap-3 pt-1">
              {transportRoutes.map((route) => (
                <div
                  key={route.id}
                  onClick={() => onSelectRoute(route.id)}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all text-left flex flex-col gap-2 ${
                    selectedRouteId === route.id
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
              ))}
            </div>
          </div>

          {activeRoute?.stops && activeRoute.stops.length > 0 && (
            <div className="space-y-1.5">
              <label
                htmlFor="register-stop-id"
                className="text-xs font-semibold text-foreground uppercase tracking-wider block"
              >
                {t("register.pickupStopOptional")}
              </label>
              <select
                id="register-stop-id"
                value={selectedStopId}
                onChange={(e) => onSelectStop(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">
                  {t("register.generalDeparturePoint", { point: activeRoute.departurePoint })}
                </option>
                {[...activeRoute.stops]
                  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                  .map((stop, index) => (
                    <option key={stop.id} value={stop.id}>
                      {index + 1}. {stop.name}
                      {stop.estimatedArrivalTime
                        ? ` · ETA ${new Date(stop.estimatedArrivalTime).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`
                        : ""}
                      {stop.maxSeats != null ? ` (máx. ${stop.maxSeats})` : ""}
                    </option>
                  ))}
              </select>
              {selectedStopId && (() => {
                const stop = activeRoute.stops?.find((s) => s.id === selectedStopId);
                if (!stop?.latitude || !stop?.longitude) return null;
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}`;
                const waUrl = `https://wa.me/?text=${encodeURIComponent(`Paradero ${stop.name}: ${mapsUrl}`)}`;
                return (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      Cómo llegar (Maps)
                    </a>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-emerald-600 hover:underline"
                    >
                      Compartir por WhatsApp
                    </a>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Contact Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
              {t("register.contactPhoneForBus")}{" "}
              <span className="text-rose-500 font-bold">{t("register.requiredMark")}</span>:
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-sm text-muted-foreground font-medium select-none pointer-events-none border-r border-border/80 pr-2.5">
                +51
              </span>
              <input
                type="tel"
                maxLength={9}
                placeholder="912345678"
                value={contactPhone}
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, "");
                  if (onlyDigits.length <= 9) {
                    onChangeContactPhone(onlyDigits);
                  }
                }}
                style={{ paddingLeft: "54px" }}
                className={`w-full pr-3 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 font-medium tracking-wide ${
                  contactPhone.length === 0
                    ? "border-border focus:ring-primary/20 focus:border-primary"
                    : contactPhone.length < 9
                    ? "border-amber-500/40 focus:ring-amber-500/20 focus:border-amber-500"
                    : !contactPhone.startsWith("9")
                    ? "border-rose-500/40 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-green-500/40 focus:ring-green-500/20 focus:border-green-500"
                }`}
              />
            </div>
            {contactPhone.length > 0 && (
              <p
                className={`text-[10px] font-semibold transition-all duration-300 ${
                  contactPhone.length < 9
                    ? "text-amber-500"
                    : !contactPhone.startsWith("9")
                    ? "text-rose-500"
                    : "text-green-500"
                }`}
              >
                {contactPhone.length < 9
                  ? t("register.digitsMissing", {
                      count: 9 - contactPhone.length,
                      plural: 9 - contactPhone.length > 1 ? "s" : "",
                    })
                  : !contactPhone.startsWith("9")
                  ? t("register.phoneMustStartWith9")
                  : t("register.phoneCompleteValid")}
              </p>
            )}
            {contactPhone.length === 0 && (
              <p className="text-[10px] text-muted-foreground">
                {t("register.phoneExactly9Help")}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
