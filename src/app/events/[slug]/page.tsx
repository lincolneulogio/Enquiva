import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getCategories, getEventBySlug } from "@/actions/events";
import { getRegistrationForEvent } from "@/actions/registrations";
import { getUserPayments } from "@/actions/payments";
import { RegisterButton } from "@/components/events/RegisterButton";
import { TicketCard } from "@/components/tickets/TicketCard";
import { PublicHeader } from "@/components/shared/PublicHeader";
import Link from "next/link";
import Image from "next/image";
import { categoryColor, categoryLabel, cn, formatEventDate } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale } from "@/lib/i18n/core";
import { db } from "@/lib/db";
import { transportRoutes, transportBookings } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { Calendar, MapPin, Clock, AlertTriangle, Route, ArrowRight, Bus } from "lucide-react";

interface EventPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { t, locale } = await getI18n();
  const { slug } = await params;
  const [event, categories] = await Promise.all([
    getEventBySlug(slug),
    getCategories(),
  ]);

  if (!event) {
    return notFound();
  }

  // Fetch active transport routes if transport is enabled
  let routes: any[] = [];
  let serializedRoutes: any[] = [];
  let totalTransportSeats = 0;
  let totalBookedTransportSeats = 0;
  if (event.hasTransport) {
    try {
      routes = await db
        .select()
        .from(transportRoutes)
        .where(and(eq(transportRoutes.eventId, event.id), eq(transportRoutes.isActive, true)))
        .orderBy(transportRoutes.departureTime);

      serializedRoutes = routes.map((r) => ({
        id: r.id,
        eventId: r.eventId,
        name: r.name,
        departurePoint: r.departurePoint,
        departureTime: r.departureTime instanceof Date ? r.departureTime.toISOString() : String(r.departureTime),
        returnTime: r.returnTime instanceof Date ? r.returnTime.toISOString() : r.returnTime ? String(r.returnTime) : null,
        pricePerSeat: String(r.pricePerSeat),
        totalSeats: Number(r.totalSeats),
        description: r.description,
        isActive: r.isActive,
      }));

      // Calculate total seats capacity
      totalTransportSeats = routes.reduce((sum, r) => sum + Number(r.totalSeats), 0);

      // Fetch dynamic passenger bookings
      if (routes.length > 0) {
        const [bookingSum] = await db
          .select({
            booked: sql<number>`COALESCE(SUM(${transportBookings.seats}), 0)::int`
          })
          .from(transportBookings)
          .innerJoin(transportRoutes, eq(transportBookings.routeId, transportRoutes.id))
          .where(
            and(
              eq(transportRoutes.eventId, event.id),
              sql`${transportBookings.status} != 'cancelled'`
            )
          );
        totalBookedTransportSeats = bookingSum?.booked ?? 0;
      }
    } catch (err) {
      console.error("Failed to load transport routes or dynamic stats:", err);
    }
  }

  const formatRouteDateTime = (dateStr: Date | string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "en" ? "en-US" : "es-PE", {
      weekday: "long",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const categoryMeta = categories.find((category) => category.slug === event.category);

  const sessionHeaders = await headers();
  const session = await auth.api.getSession({ headers: sessionHeaders });

  let registrationData = null;
  try {
    registrationData = await getRegistrationForEvent(event.id);
  } catch {
    registrationData = null;
  }

  const isAuthenticated = Boolean(session?.user);
  const registration = registrationData?.registration;
  const ticket = registrationData?.ticket;
  const payments = session?.user ? await getUserPayments().catch(() => []) : [];
  const paymentForRegistration = registration
    ? payments.find(({ registration: item }) => item.id === registration.id)
    : null;
  const isFull =
    typeof event.capacity === "number" &&
    (event.attendeeCount ?? 0) >= event.capacity;
  const isEventExpired = new Date(event.date).getTime() <= Date.now();
  const isRegistrationClosed = isEventExpired || Boolean(isFull) || event.status !== "published";
  const registrationClosedReason = isEventExpired
    ? t("register.eventExpired")
    : isFull
      ? t("register.eventFull")
      : event.status !== "published"
        ? t("register.registrationUnavailable")
        : null;
  const eventStatusLabel =
    event.status === "published"
      ? "Publicado"
      : event.status === "draft"
        ? "Borrador"
        : event.status === "cancelled"
          ? "Cancelado"
          : event.status;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="relative overflow-hidden border-b border-border bg-card px-6 py-16 shadow-sm">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="space-y-4">
              <div>
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                    categoryMeta?.colorClass || categoryColor(event.category)
                  )}
                >
                  {categoryLabel(event.category, locale)}
                </span>
              </div>

              <h1 className="text-4xl font-semibold leading-tight text-foreground">
                {event.title}
              </h1>

              {event.coverImage && (
                <div className="overflow-hidden rounded-3xl border border-border bg-muted shadow-sm">
                  <Image
                    src={event.coverImage}
                    alt={event.title}
                    width={1200}
                    height={675}
                    className="h-72 w-full object-contain bg-muted md:h-96"
                    priority
                  />
                </div>
              )}

              <p className="text-lg text-muted-foreground">{event.description}</p>

              {/* SECCIÓN 1: DETALLES DEL EVENTO */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
                <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 border-b border-border pb-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Calendar className="h-4 w-4" />
                  </span>
                  Información General del Evento
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 text-sm text-muted-foreground">
                  <div className="space-y-1">
                    <span className="block text-xs uppercase tracking-wider text-muted-foreground/60">Fecha y Hora</span>
                    <span className="font-medium text-foreground">{formatEventDate(event.date)}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-xs uppercase tracking-wider text-muted-foreground/60">Ubicación</span>
                    <span className="font-medium text-foreground">
                      {event.location ?? (event.isVirtual ? t("common.virtualEvent") : t("common.locationTbd"))}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-xs uppercase tracking-wider text-muted-foreground/60">Capacidad Total</span>
                    <span className="font-medium text-foreground">{event.capacity ?? t("public.eventDetail.unlimited")} personas</span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-xs uppercase tracking-wider text-muted-foreground/60">Costo de Entrada</span>
                    <span className="font-semibold text-primary text-base">
                      {event.price && Number(event.price) > 0 ? `S/ ${Number(event.price).toFixed(2)}` : "Gratuita"}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: INFORMACIÓN DE TRANSPORTE Y MOVILIDAD */}
              {event.hasTransport && (
                <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-primary/5 p-6 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
                    <div className="space-y-1">
                      <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                          <Bus className="h-4 w-4" />
                        </span>
                        Servicio de Transporte y Movilidad
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Coordinado por el organizador para garantizar tu traslado seguro.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                      Costo Adicional
                    </span>
                  </div>

                  <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs text-amber-800 dark:text-amber-300">
                      <p className="font-semibold text-amber-700 dark:text-amber-400">¡El transporte NO está incluido en la entrada!</p>
                      <p>
                        El precio de la <strong>Entrada al Evento</strong> es independiente del costo del transporte. Los precios indicados en las rutas son <strong>por asiento</strong> y corresponden al pasaje de traslado. Deberás seleccionarlo y pagarlo al momento de tu registro.
                      </p>
                    </div>
                  </div>

                  {/* SECCIÓN 3: RUTAS Y TARIFAS DISPONIBLES */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Route className="h-4 w-4 text-primary" />
                      Rutas y Puntos de Salida Disponibles
                    </h4>

                    {routes.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        No se han configurado rutas de transporte activas para este evento aún.
                      </p>
                    ) : (
                      <div className="grid gap-4">
                        {routes.map((route) => (
                          <div
                            key={route.id}
                            className="rounded-2xl border border-border bg-card p-4 hover:border-blue-500/30 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="space-y-2">
                              <div>
                                <h5 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                                  {route.name}
                                </h5>
                                {route.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{route.description}</p>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                  <span>
                                    <strong>Partida:</strong> {route.departurePoint}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                  <span>
                                    <strong>Salida:</strong> {formatRouteDateTime(route.departureTime)}
                                  </span>
                                </div>
                                {route.returnTime && (
                                  <div className="flex items-center gap-1.5 sm:col-span-2 mt-1 pt-1 border-t border-border/40">
                                    <ArrowRight className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                    <span>
                                      <strong>Retorno estimado:</strong> {formatRouteDateTime(route.returnTime)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
                              <span className="text-xs text-muted-foreground">Pasaje por asiento</span>
                              <span className="font-bold text-lg text-primary bg-primary/10 px-3 py-1 rounded-xl">
                                S/ {Number(route.pricePerSeat).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-full max-w-sm space-y-4 lg:justify-self-end">
              <RegisterButton
                eventId={event.id}
                isAuthenticated={isAuthenticated}
                isRegistrationClosed={isRegistrationClosed}
                closedReason={registrationClosedReason}
                hasTransport={event.hasTransport}
                currentStatus={registration?.status}
                registrationId={registration?.id}
                transportRoutes={serializedRoutes}
                eventPrice={event.price ? Number(event.price) : 0}
                paymentStatus={paymentForRegistration?.payment?.status}
              />

              <div className="fe-glass rounded-3xl p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{t("public.eventDetail.attendeesLabel")}</p>
                <p className="mt-3 text-3xl font-semibold text-foreground">
                  {(event.attendeeCount ?? 0).toLocaleString(getIntlLocale(locale))}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{t("public.eventDetail.attendingSuffix")}</p>
              </div>

              {event.hasTransport && totalTransportSeats > 0 && (
                <div className="fe-glass rounded-3xl p-5 shadow-sm border border-blue-500/10 dark:border-blue-500/5">
                  <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-1.5">
                    <Bus className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    Pasajeros Bus
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">
                    {totalBookedTransportSeats}{" "}
                    <span className="text-lg font-normal text-muted-foreground">
                      / {totalTransportSeats}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    asientos reservados ({Math.round(totalTransportSeats > 0 ? (totalBookedTransportSeats / totalTransportSeats) * 100 : 0)}% ocupado)
                  </p>
                </div>
              )}

              <div className="fe-glass rounded-3xl p-5 shadow-sm">
                <h3 className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{t("common.organizer")}</h3>
                <p className="mt-3 text-lg font-semibold text-foreground">{t("public.eventDetail.organizerName")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("public.eventDetail.organizerDescription")}</p>
              </div>

              {isAuthenticated && (
                <div className="fe-glass rounded-3xl p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-foreground">{t("public.eventDetail.quickLinksTitle")}</h3>
                  <div className="mt-4 space-y-2 text-sm">
                    <Link href="/member/events" className="block text-primary hover:underline">
                      {t("public.eventDetail.reviewRegistrations")}
                    </Link>
                    <Link href="/member/payments" className="block text-primary hover:underline">
                      {t("public.eventDetail.checkPaymentHistory")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {registration && (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <TicketCard
            ticket={ticket}
            event={event}
            registration={registration}
            paymentStatus={paymentForRegistration?.payment.status}
          />
        </section>
      )}
    </div>
  );
}
