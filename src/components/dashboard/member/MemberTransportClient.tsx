"use client";

import { useState } from "react";
import Link from "next/link";
import { Bus, Calendar, Ticket, ArrowLeft, ArrowRight, ShieldCheck, Clock, MapPin, Lightbulb } from "lucide-react";
import { TransportBookingForm, CancelTransportButton } from "@/components/tickets/TransportBookingForm";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { getPluralLabel, getPaymentStatusLabel } from "@/lib/i18n/core";

interface RouteStop {
  id: string;
  name: string;
  latitude: string | null;
  longitude: string | null;
}

interface RouteItem {
  id: string;
  name: string;
  departurePoint: string;
  departureTime: Date;
  returnTime: Date | null;
  pricePerSeat: string;
  totalSeats: number;
  availableSeats: number;
  alreadyBooked: boolean;
  stops: RouteStop[];
}

interface PaymentMethod {
  id: string;
  type: "yape" | "plin" | "cash" | "culqi";
  label: string;
  qrCodeUrl?: string | null;
  phone?: string | null;
  holderName: string;
}

interface EventOption {
  registrationId: string;
  eventId: string;
  eventTitle: string;
  routes: RouteItem[];
  paymentMethods: PaymentMethod[];
}

interface BookingItem {
  id: string;
  routeName: string;
  departurePoint: string;
  departureTime: Date;
  seats: number;
  paymentAmount: string;
  paymentStatus: string | null;
  status: string | null;
  registrationId: string;
}

interface MemberTransportClientProps {
  options: EventOption[];
  myBookings: BookingItem[];
}

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30",
  approved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30",
  rejected: "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50 dark:border-red-900/30",
};

const BOOKING_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30",
  confirmed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50 dark:border-red-900/30",
};

function getBookingStatusLabel(status: string, locale: string) {
  const labels: Record<string, Record<string, string>> = {
    pending: { es: "Pendiente", en: "Pending" },
    confirmed: { es: "Confirmado", en: "Confirmed" },
    cancelled: { es: "Cancelado", en: "Cancelled" },
  };
  return labels[status]?.[locale] ?? status;
}

export function MemberTransportClient({ options, myBookings }: MemberTransportClientProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [activeTab, setActiveTab] = useState<"book" | "history">("book");

  // Filters to find only active options that have at least one route
  const availableOptions = options.filter((o) => o.routes.length > 0);
  const totalAvailableRoutesCount = availableOptions.reduce((sum, o) => sum + o.routes.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{t("dashboard.member.transportTitle")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("dashboard.member.transportSubtitle")}
        </p>
      </div>

      {/* Segmented Premium Tab Controls */}
      <div className="flex p-1.5 bg-muted/60 backdrop-blur-xs rounded-2xl border border-border/80 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("book")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold rounded-xl transition-all duration-200 select-none ${
            activeTab === "book"
              ? "bg-background text-primary shadow-xs border border-border/40"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bus className="h-4 w-4 shrink-0" />
          <span>{locale === "en" ? "Available Routes" : "Buscar Rutas"}</span>
          {totalAvailableRoutesCount > 0 && (
            <span className={`inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-bold rounded-full transition-colors ${
              activeTab === "book" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
            }`}>
              {totalAvailableRoutesCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold rounded-xl transition-all duration-200 select-none ${
            activeTab === "history"
              ? "bg-background text-primary shadow-xs border border-border/40"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Ticket className="h-4 w-4 shrink-0" />
          <span>{locale === "en" ? "My Bookings" : "Mis Reservas"}</span>
          {myBookings.length > 0 && (
            <span className={`inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-bold rounded-full transition-colors ${
              activeTab === "history" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
            }`}>
              {myBookings.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-8 animate-in fade-in-50 duration-200">
        {activeTab === "book" ? (
          /* TAB 1: AVAILABLE ROUTES TO BOOK */
          <div className="space-y-8">
            {options.length === 0 ? (
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
            ) : availableOptions.length === 0 ? (
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
            ) : (
              <div className="space-y-8">
                {availableOptions.map((eventItem) => (
                  <section key={eventItem.registrationId} className="space-y-4 rounded-2xl border border-border/80 bg-card p-6 shadow-3xs">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                      <Calendar className="h-5 w-5 text-primary shrink-0" />
                      <h2 className="font-display text-xl font-bold text-foreground">
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
                              stops: route.stops,
                            }}
                            registrationId={eventItem.registrationId}
                            paymentMethods={eventItem.paymentMethods}
                          />
                        )
                      )}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: MY BOOKINGS HISTORY */
          <div className="space-y-6">
            {myBookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center max-w-2xl mx-auto space-y-4">
                <Ticket className="mx-auto h-12 w-12 text-primary/30" />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground text-lg">{locale === "en" ? "No bookings yet" : "Sin reservas de viaje"}</p>
                  <p className="text-sm text-muted-foreground">
                    {locale === "en" 
                      ? "Booked transport seats for your registered events will appear here." 
                      : "Las reservas de transporte que realices para tus eventos registrados aparecerán listadas aquí."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("book")}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-xs"
                >
                  <span>{locale === "en" ? "Find Available Routes" : "Reservar un Asiento"}</span>
                </button>
              </div>
            ) : (
              <div className="grid gap-4 max-w-4xl">
                {myBookings.map((booking) => {
                  const seatWord = getPluralLabel(locale, t("dashboard.member.seatsLabel"), `${t("dashboard.member.seatsLabel")}s`, booking.seats);
                  const payStatus = booking.paymentStatus ?? "pending";
                  const bookStatus = booking.status ?? "pending";
                  return (
                    <div key={booking.id} className="rounded-2xl border border-border bg-card p-5 shadow-3xs hover:shadow-2xs transition-all duration-200 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="space-y-2">
                          <h3 className="font-bold text-foreground text-lg leading-tight">{booking.routeName}</h3>
                          <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Ticket className="h-4 w-4 text-primary shrink-0" />
                            <span>
                              {booking.seats} {seatWord} · <span className="text-foreground font-bold">S/. {Number(booking.paymentAmount).toFixed(2)}</span>
                            </span>
                          </p>
                          <div className="space-y-1 pt-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                              <span className="font-semibold text-foreground uppercase tracking-wider text-[10px]">Salida:</span>
                              <span>{booking.departurePoint}</span>
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                              <span className="font-semibold text-foreground uppercase tracking-wider text-[10px]">Fecha/Hora:</span>
                              <span className="capitalize">
                                {new Date(booking.departureTime).toLocaleDateString(locale === "es" ? "es-PE" : "en-US", {
                                  weekday: "long",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap sm:flex-col sm:items-end gap-2 shrink-0">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">{t("dashboard.member.paymentLabel")}:</span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${PAYMENT_STATUS_STYLES[payStatus] ?? PAYMENT_STATUS_STYLES.pending}`}>
                              {getPaymentStatusLabel(payStatus, locale)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">{t("dashboard.member.bookingStatusLabel")}:</span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${BOOKING_STATUS_STYLES[bookStatus] ?? BOOKING_STATUS_STYLES.pending}`}>
                              {getBookingStatusLabel(bookStatus, locale)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {payStatus === "pending" && (
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="text-xs text-amber-800 dark:text-amber-300">
                            <p className="font-bold flex items-center gap-1.5">
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                              Requiere pago consolidado
                            </p>
                            <p className="text-muted-foreground mt-0.5">Puedes completar el pago consolidado (entrada + transporte) de forma unificada.</p>
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            {booking.status === "pending" && (
                              <CancelTransportButton bookingId={booking.id} />
                            )}
                            <Link
                              href={`/member/payments/new/${booking.registrationId}`}
                              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-all shadow-xs hover:shadow"
                            >
                              Pagar S/. {Number(booking.paymentAmount).toFixed(2)}
                            </Link>
                          </div>
                        </div>
                      )}

                      {payStatus !== "pending" && booking.status === "pending" && (
                        <div className="flex justify-end pt-2 border-t border-border/40">
                          <CancelTransportButton bookingId={booking.id} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
