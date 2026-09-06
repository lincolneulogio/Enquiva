"use client";

import React from "react";
import { Sparkles, CalendarDays, MapPin } from "lucide-react";
import { getIntlLocale } from "@/lib/i18n/core";
import { EventInfoContext } from "./types";

interface EventContextBannerProps {
  eventInfo?: EventInfoContext;
  locale: "es" | "en";
}

export function EventContextBanner({
  eventInfo,
  locale,
}: EventContextBannerProps) {
  const eventDateLabel = (() => {
    if (!eventInfo?.date) return null;
    const d = new Date(eventInfo.date);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString(getIntlLocale(locale), {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  })();

  const eventEndLabel = (() => {
    if (!eventInfo?.endDate) return null;
    const d = new Date(eventInfo.endDate);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString(getIntlLocale(locale), {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  })();

  const eventPlaceLabel = eventInfo?.isVirtual
    ? locale === "en"
      ? "Virtual event"
      : "Evento virtual"
    : eventInfo?.location?.trim() || null;

  const showEventContext = Boolean(eventDateLabel || eventPlaceLabel || eventInfo?.title);

  if (!showEventContext) return null;

  return (
    <section className="overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
      <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        {locale === "en" ? "Event reference" : "Referencia del evento"}
      </p>
      {eventInfo?.title ? (
        <h3 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {eventInfo.title}
        </h3>
      ) : null}
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {locale === "en"
          ? "Align pickup points and departure times with the venue. Attendees who already have their entry QR can book the bus later as a separate paid add-on."
          : "Alinea puntos de recojo y horarios de salida con el lugar. Quienes ya tienen QR de entrada podrán reservar el bus después, como pago aparte."}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {eventDateLabel && (
          <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3.5 shadow-xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {locale === "en" ? "Event date" : "Fecha del evento"}
              </p>
              <p className="mt-0.5 text-sm font-medium capitalize text-foreground">
                {eventDateLabel}
              </p>
              {eventEndLabel ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {locale === "en" ? "Ends" : "Termina"}: {eventEndLabel}
                </p>
              ) : null}
            </div>
          </div>
        )}
        {eventPlaceLabel && (
          <div className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3.5 shadow-xs">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {locale === "en" ? "Venue" : "Lugar"}
              </p>
              <p className="mt-0.5 text-sm font-medium break-words text-foreground">
                {eventPlaceLabel}
              </p>
              {!eventInfo?.isVirtual &&
              eventInfo?.latitude != null &&
              eventInfo?.longitude != null ? (
                <a
                  href={`https://www.google.com/maps?q=${eventInfo.latitude},${eventInfo.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex text-xs font-semibold text-primary underline-offset-2 hover:underline"
                >
                  {locale === "en" ? "Open in Maps" : "Abrir en Maps"}
                </a>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
