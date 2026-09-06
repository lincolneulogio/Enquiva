"use client";

import Link from "next/link";
import { Bus, Calendar, Ticket, ArrowRight, ShieldCheck, MapPin, Lightbulb } from "lucide-react";
import { TransportBookingForm } from "@/components/tickets/TransportBookingForm";
import { useTranslations } from "@/components/providers/LocaleProvider";
import type { EventOption } from "./types";

interface AvailableRoutesTabProps {
  options: EventOption[];
  availableOptions: EventOption[];
}

export function AvailableRoutesTab({ options, availableOptions }: AvailableRoutesTabProps) {
  const t = useTranslations();

  if (options.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center max-w-2xl mx-auto space-y-4">
        <Ticket className="mx-auto h-12 w-12 text-primary/30" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground text-lg">{t("dashboard.member.noActiveEvents")}</p>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.member.registerFirstForTransport")}
          </p>
        </div>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-xs hover:shadow"
        >
          <span>{t("dashboard.member.exploreEvents")}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  if (availableOptions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center max-w-2xl mx-auto space-y-4">
        <Bus className="mx-auto h-12 w-12 text-primary/30" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground text-lg">{t("dashboard.member.noRoutesAvailable")}</p>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.member.noRoutesHelp")}
          </p>
        </div>
        <Link
          href="/member/events"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition-all shadow-xs"
        >
          <span>{t("dashboard.member.viewMyEvents")}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {availableOptions.map((eventItem) => (
        <section key={eventItem.registrationId} className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-border/70">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Calendar className="h-4 w-4" />
            </div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {eventItem.eventTitle}
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {eventItem.routes.map((route) =>
              route.alreadyBooked ? (
                <div key={route.id} className="rounded-2xl border border-border bg-muted/20 p-5 flex flex-col justify-between h-full space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <h3 className="font-bold text-foreground text-lg leading-tight">{route.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{route.departurePoint}</span>
                      </p>
                    </div>
                    <span className="w-fit inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 px-3 py-1 text-xs font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {t("dashboard.member.alreadyBooked")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/40 flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 animate-pulse" />
                    <span>{t("dashboard.member.bookingChangeHint")}</span>
                  </p>
                </div>
              ) : (
                <TransportBookingForm
                  key={route.id}
                  route={{
                    id: route.id,
                    name: route.name,
                    departurePoint: route.departurePoint,
                    departureTime: new Date(route.departureTime),
                    returnTime: route.returnTime ? new Date(route.returnTime) : null,
                    pricePerSeat: String(route.pricePerSeat),
                    totalSeats: route.totalSeats,
                    availableSeats: route.availableSeats,
                    isRoundTrip: route.isRoundTrip,
                    stops: route.stops,
                  }}
                  registrationId={eventItem.registrationId}
                  paymentMethods={eventItem.paymentMethods}
                  culqiPublicKey={
                    eventItem.paymentMethods.find((m) => m.type === "culqi")?.culqiPublicKey ?? null
                  }
                  eventTitle={eventItem.eventTitle}
                />
              )
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
