"use client";

import React from "react";
import Link from "next/link";
import { Bus, AlertTriangle } from "lucide-react";
import { TransportBookingInfo } from "./types";

interface TransportBookingBadgeProps {
  transportBooking?: TransportBookingInfo | null;
  hasTransport: boolean;
  transportOfferFromPrice?: number | null;
  locale: string;
}

export function TransportBookingBadge({
  transportBooking,
  hasTransport,
  transportOfferFromPrice,
  locale,
}: TransportBookingBadgeProps) {
  if (transportBooking) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 md:p-5 space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-primary/10 pb-3">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Bus className="h-4 w-4 text-primary" />
            {locale === "en" ? "Transport Service" : "Servicio de Transporte"}
          </h4>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              transportBooking.booking.status === "confirmed"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
            }`}
          >
            {transportBooking.booking.status === "confirmed"
              ? locale === "en"
                ? "Confirmed"
                : "Confirmado"
              : locale === "en"
              ? "Pending Approval"
              : "Reserva Pendiente"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-muted-foreground font-semibold">
              {locale === "en" ? "Route / Bus" : "Ruta / Autobús"}
            </p>
            <p className="font-bold text-foreground text-sm mt-0.5">
              {transportBooking.route.name}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground font-semibold">
              {locale === "en" ? "Departure point & Time" : "Punto de partida y Hora"}
            </p>
            <p className="font-bold text-foreground text-sm mt-0.5">
              {transportBooking.stop?.name ?? transportBooking.route.departurePoint}
            </p>
            <p className="text-muted-foreground mt-0.5">
              {new Date(transportBooking.route.departureTime).toLocaleString(
                locale === "es" ? "es-PE" : "en-US",
                {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground font-semibold">
              {locale === "en" ? "Seats / Amount" : "Asientos / Pago"}
            </p>
            <p className="font-bold text-foreground text-sm mt-0.5">
              {transportBooking.booking.seats}{" "}
              {transportBooking.booking.seats > 1
                ? locale === "en"
                  ? "seats"
                  : "asientos"
                : locale === "en"
                ? "seat"
                : "asiento"}
            </p>
            <p className="text-muted-foreground mt-0.5">
              S/.{" "}
              {(
                Number(transportBooking.route.pricePerSeat) * transportBooking.booking.seats
              ).toFixed(2)}{" "}
              ({locale === "en" ? "Total" : "Total"})
            </p>
          </div>
        </div>

        {transportBooking.booking.status === "pending" && (
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3 text-[11px] text-amber-800 dark:text-amber-300">
            <span className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>
                {locale === "en"
                  ? "Payment Verification Required"
                  : "Verificación de Pago Requerida"}
              </span>
            </span>
            <p className="mt-0.5 leading-normal">
              {locale === "en"
                ? "Your transport booking is registered but is pending administrator payment verification. Click 'Manage Transport' to complete/upload proof."
                : "Tu reserva está registrada pero falta la aprobación del pago por el administrador. Da clic en 'Gestionar Transporte' para completarlo."}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (hasTransport && transportOfferFromPrice != null) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 md:p-5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bus className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="inline-flex items-center rounded-full border border-primary/20 bg-background/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              {locale === "en" ? "Add-on" : "Extra"}
            </p>
            <h4 className="text-sm font-bold text-foreground">
              {locale === "en" ? "Transport now available" : "Transporte disponible"}
            </h4>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {locale === "en"
                ? `Your entry QR is ready. Bus seats are a separate paid add-on from S/ ${transportOfferFromPrice.toFixed(2)} per seat.`
                : `Tu QR de entrada ya está listo. El bus es un pago aparte, desde S/ ${transportOfferFromPrice.toFixed(2)} por asiento.`}
            </p>
            <Link
              href="/member/transport"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
            >
              <Bus className="h-3.5 w-3.5" />
              {locale === "en" ? "Book & pay transport" : "Reservar y pagar transporte"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (hasTransport && transportOfferFromPrice == null) {
    return (
      <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 text-xs text-muted-foreground">
        {locale === "en"
          ? "This event has transport enabled. Routes will appear in My trips when the organizer publishes them."
          : "Este evento tiene transporte habilitado. Las rutas aparecerán en Mis viajes cuando el organizador las publique."}
      </div>
    );
  }

  return null;
}
