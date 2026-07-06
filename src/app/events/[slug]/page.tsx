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
import { EventCoverFrame } from "@/components/events/EventCoverFrame";
import { categoryColor, categoryLabel, cn, formatEventDate } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale } from "@/lib/i18n/core";
import { incrementEventViewCount } from "@/lib/analytics/event-views";
import { db } from "@/lib/db";
import { transportRoutes, transportBookings, transportStops } from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import {
  Calendar,
  MapPin,
  Clock,
  AlertTriangle,
  Route,
  ArrowRight,
  Bus,
  Users,
  Ticket,
  Coins,
  ChevronRight,
  CreditCard,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Info,
} from "lucide-react";

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

  if (event.status === "published") {
    await incrementEventViewCount(event.id);
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
        .where(
          and(
            eq(transportRoutes.eventId, event.id),
            eq(transportRoutes.isActive, true),
          ),
        )
        .orderBy(transportRoutes.departureTime);

      const routeIds = routes.map((r) => r.id);
      const stops =
        routeIds.length > 0
          ? await db
              .select()
              .from(transportStops)
              .where(inArray(transportStops.routeId, routeIds))
          : [];

      const stopsByRoute = stops.reduce<Record<string, typeof stops>>((acc, stop) => {
        if (!acc[stop.routeId]) acc[stop.routeId] = [];
        acc[stop.routeId].push(stop);
        return acc;
      }, {});

      serializedRoutes = routes.map((r) => ({
        id: r.id,
        eventId: r.eventId,
        name: r.name,
        departurePoint: r.departurePoint,
        departureTime:
          r.departureTime instanceof Date
            ? r.departureTime.toISOString()
            : String(r.departureTime),
        returnTime:
          r.returnTime instanceof Date
            ? r.returnTime.toISOString()
            : r.returnTime
              ? String(r.returnTime)
              : null,
        pricePerSeat: String(r.pricePerSeat),
        totalSeats: Number(r.totalSeats),
        description: r.description,
        isActive: r.isActive,
        stops: (stopsByRoute[r.id] ?? []).map((stop) => ({
          id: stop.id,
          name: stop.name,
          latitude: stop.latitude,
          longitude: stop.longitude,
        })),
      }));

      // Calculate total seats capacity
      totalTransportSeats = routes.reduce(
        (sum, r) => sum + Number(r.totalSeats),
        0,
      );

      // Fetch dynamic passenger bookings
      if (routes.length > 0) {
        const [bookingSum] = await db
          .select({
            booked: sql<number>`COALESCE(SUM(${transportBookings.seats}), 0)::int`,
          })
          .from(transportBookings)
          .innerJoin(
            transportRoutes,
            eq(transportBookings.routeId, transportRoutes.id),
          )
          .where(
            and(
              eq(transportRoutes.eventId, event.id),
              sql`${transportBookings.status} != 'cancelled'`,
            ),
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
      hour12: true,
    });
  };

  const categoryMeta = categories.find(
    (category) => category.slug === event.category,
  );

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
  const isRegistrationClosed = isEventExpired || event.status !== "published";
  const waitlistAvailable =
    isFull && !isEventExpired && event.status === "published";
  const registrationClosedReason = isEventExpired
    ? t("register.eventExpired")
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
    <div className="min-h-screen bg-background pb-12">
      <PublicHeader />

      <section className="relative overflow-hidden border-b border-border fe-gradient-mesh px-4 py-8 md:py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-12">
            {/* LEFT COLUMN: Main Info */}
            <div className="space-y-6 md:space-y-8">
              {/* Category Badge & Title */}
              <div className="space-y-3">
                <div>
                  <span
                    className={cn(
                      "inline-flex rounded-xl px-3 py-1 text-xs font-bold uppercase tracking-wider border",
                      categoryMeta?.colorClass || categoryColor(event.category),
                    )}
                  >
                    {categoryLabel(event.category, locale)}
                  </span>
                </div>

                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight md:leading-tight">
                  {event.title}
                </h1>
              </div>

              {/* Cover Image */}
              {event.coverImage && (
                <EventCoverFrame
                  src={event.coverImage}
                  alt={event.title}
                  variant="detail"
                  priority
                  imageClassName="group-hover:scale-[1.01]"
                  className="group"
                />
              )}

              {/* Description */}
              <p className="text-lg leading-relaxed text-muted-foreground bg-card/45 p-6 rounded-3xl border border-border/50 backdrop-blur-sm shadow-sm">
                {event.description}
              </p>

              {/* SECTION 1: EVENT GENERAL DETAILS */}
              <div className="rounded-3xl border border-border bg-card/60 p-6 md:p-8 shadow-sm space-y-6 backdrop-blur-sm">
                <h3 className="font-display text-lg sm:text-xl font-bold text-foreground flex items-center gap-2 border-b border-border/80 pb-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Info className="h-4 w-4" />
                  </span>
                  Información del Evento
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Date & Time */}
                  <div className="flex gap-4 p-4 rounded-2xl border border-border/50 bg-background/50 hover:bg-background transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        Fecha y Hora
                      </span>
                      <span className="font-semibold text-foreground text-sm leading-tight block">
                        {formatEventDate(event.date)}
                      </span>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex gap-4 p-4 rounded-2xl border border-border/50 bg-background/50 hover:bg-background transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        Ubicación
                      </span>
                      <span className="font-semibold text-foreground text-sm leading-tight block">
                        {event.location ??
                          (event.isVirtual
                            ? t("common.virtualEvent")
                            : t("common.locationTbd"))}
                      </span>
                    </div>
                  </div>

                  {/* Capacity */}
                  <div className="flex gap-4 p-4 rounded-2xl border border-border/50 bg-background/50 hover:bg-background transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        Capacidad Total
                      </span>
                      <span className="font-semibold text-foreground text-sm leading-tight block">
                        {event.capacity ?? t("public.eventDetail.unlimited")}{" "}
                        personas
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex gap-4 p-4 rounded-2xl border border-border/50 bg-background/50 hover:bg-background transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <Coins className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        Costo de Entrada
                      </span>
                      <span className="font-bold text-primary text-base block">
                        {event.price && Number(event.price) > 0
                          ? `S/ ${Number(event.price).toFixed(2)}`
                          : "Gratuita"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: TRANSPORT & MOBILITY */}
              {event.hasTransport && (
                <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-50/50 via-background to-indigo-50/30 dark:from-blue-950/10 dark:via-background dark:to-indigo-950/5 p-6 md:p-8 shadow-md space-y-6 backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
                    <div className="space-y-1">
                      <h3 className="font-display text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                          <Bus className="h-4 w-4" />
                        </span>
                        Servicio de Transporte
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Coordinado de forma segura para garantizar tu traslado.
                      </p>
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200/30 shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Costo Adicional
                      </span>
                    </div>
                  </div>

                  {/* Warning Alert */}
                  <div className="rounded-2xl bg-amber-50/85 border border-amber-200/50 dark:bg-amber-950/20 dark:border-amber-900/30 p-4 flex items-start gap-3 shadow-sm">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
                      <p className="font-bold text-amber-800 dark:text-amber-400">
                        ¡El transporte NO está incluido en la entrada!
                      </p>
                      <p>
                        El precio de la <strong>Entrada al Evento</strong> es
                        independiente del costo del transporte. Los precios
                        indicados en las rutas son <strong>por asiento</strong>{" "}
                        y corresponden al pasaje de traslado. Deberás
                        seleccionarlo y pagarlo al momento de tu registro.
                      </p>
                    </div>
                  </div>

                  {/* Routes List */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Route className="h-4 w-4 text-primary" />
                      Rutas y Puntos de Salida Disponibles
                    </h4>

                    {routes.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic bg-background/50 p-4 rounded-xl text-center border border-dashed border-border/80">
                        No se han configurado rutas de transporte activas para
                        este evento aún.
                      </p>
                    ) : (
                      <div className="grid gap-4">
                        {routes.map((route) => (
                          <div
                            key={route.id}
                            className="group rounded-2xl border border-border bg-card p-5 hover:border-blue-500/30 hover:-translate-y-0.5 transition-all duration-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5"
                          >
                            <div className="space-y-3">
                              <div>
                                <h5 className="font-bold text-foreground text-sm flex items-center gap-1.5 group-hover:text-primary transition-colors">
                                  {route.name}
                                </h5>
                                {route.description && (
                                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    {route.description}
                                  </p>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                                  <span>
                                    <strong>Partida:</strong>{" "}
                                    {route.departurePoint}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-blue-500 shrink-0" />
                                  <span>
                                    <strong>Salida:</strong>{" "}
                                    {formatRouteDateTime(route.departureTime)}
                                  </span>
                                </div>
                                {route.returnTime && (
                                  <div className="flex items-center gap-2 sm:col-span-2 mt-1 pt-2 border-t border-border/40">
                                    <ArrowRight className="h-4 w-4 text-emerald-500 shrink-0" />
                                    <span>
                                      <strong>Retorno estimado:</strong>{" "}
                                      {formatRouteDateTime(route.returnTime)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 pt-4 md:pt-0 border-border/60 shrink-0">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">
                                Pasaje por asiento
                              </span>
                              <span className="font-bold text-lg text-primary bg-primary/10 px-4 py-1.5 rounded-2xl border border-primary/20 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
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

            {/* RIGHT COLUMN: Sticky Panel */}
            <div className="lg:sticky lg:top-24 space-y-6 lg:justify-self-end w-full max-w-sm">
              <RegisterButton
                eventId={event.id}
                isAuthenticated={isAuthenticated}
                isRegistrationClosed={isRegistrationClosed}
                waitlistAvailable={waitlistAvailable}
                closedReason={registrationClosedReason}
                hasTransport={event.hasTransport}
                currentStatus={registration?.status}
                registrationId={registration?.id}
                transportRoutes={serializedRoutes}
                eventPrice={event.price ? Number(event.price) : 0}
                paymentStatus={paymentForRegistration?.payment?.status}
              />

              {/* ASISTENTES */}
              <div className="fe-glass rounded-3xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 leading-none">
                    {t("public.eventDetail.attendeesLabel")}
                  </p>
                  <p className="text-3xl font-extrabold text-foreground leading-none pt-1">
                    {(event.attendeeCount ?? 0).toLocaleString(
                      getIntlLocale(locale),
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium pt-0.5">
                    {t("public.eventDetail.attendingSuffix")}
                  </p>
                </div>
              </div>

              {/* PASAJEROS BUS */}
              {event.hasTransport && totalTransportSeats > 0 && (
                <div className="fe-glass rounded-3xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border border-blue-500/10 dark:border-blue-500/5 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                      <Bus className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 leading-none">
                        Pasajeros Bus
                      </p>
                      <p className="text-3xl font-extrabold text-foreground leading-none pt-1">
                        {totalBookedTransportSeats}
                        <span className="text-sm font-normal text-muted-foreground/85 ml-1">
                          / {totalTransportSeats}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground font-medium pt-0.5">
                        asientos reservados (
                        {Math.round(
                          totalTransportSeats > 0
                            ? (totalBookedTransportSeats /
                                totalTransportSeats) *
                                100
                            : 0,
                        )}
                        % ocupado)
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-full bg-muted dark:bg-muted/50 rounded-full h-2 overflow-hidden shadow-inner border border-border/20">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.min(100, Math.round((totalBookedTransportSeats / totalTransportSeats) * 100))}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* ORGANIZADOR */}
              <div className="fe-glass rounded-3xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 leading-none">
                    {t("common.organizer")}
                  </h3>
                  <p className="text-base font-bold text-foreground leading-snug pt-1">
                    {t("public.eventDetail.organizerName")}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
                    {t("public.eventDetail.organizerDescription")}
                  </p>
                </div>
              </div>

              {/* ACCESOS RÁPIDOS */}
              {isAuthenticated && (
                <div className="fe-glass rounded-3xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2 border-b border-border/50 pb-3">
                    <Info className="h-3.5 w-3.5 text-primary" />
                    {t("public.eventDetail.quickLinksTitle")}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <Link
                      href="/member/events"
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 text-foreground/90 hover:text-primary group"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        <span className="font-medium text-xs">
                          {t("public.eventDetail.reviewRegistrations")}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform duration-300 group-hover:translate-x-0.5" />
                    </Link>
                    <Link
                      href="/member/payments"
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 text-foreground/90 hover:text-primary group"
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                        <span className="font-medium text-xs">
                          {t("public.eventDetail.checkPaymentHistory")}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform duration-300 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Ticket card if registered */}
      {registration && (
        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <TicketCard
            ticket={ticket}
            event={event}
            registration={registration}
            paymentStatus={paymentForRegistration?.payment.status}
            paymentReceiptUrl={paymentForRegistration?.payment.receiptUrl}
            paymentMethod={paymentForRegistration?.payment.method}
          />
        </section>
      )}
    </div>
  );
}
