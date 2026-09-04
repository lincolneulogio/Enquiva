import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories } from "@/actions/events";
import { EventService } from "@/services/events/event.service";
import { getRegistrationForEvent } from "@/actions/registrations";
import { getPaymentForRegistration } from "@/actions/payments";
import { RegisterButton } from "@/components/events/RegisterButton";
import { TicketCard } from "@/components/tickets/TicketCard";
import { LiveAttendeeCount } from "@/components/events/LiveAttendeeCount";
import { EventPresenceIndicator } from "@/components/events/EventPresenceIndicator";
import { PublicHeader } from "@/components/shared/PublicHeader";
import Link from "next/link";
import { EventCoverFrame } from "@/components/events/EventCoverFrame";
import { EventLocationMapDynamic } from "@/components/events/EventLocationMapDynamic";
import { categoryColor, categoryLabel, cn, formatEventDate } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";
import { recordEventView } from "@/lib/analytics/event-views";
import { getEventCapacitySnapshot } from "@/lib/events/capacity-snapshot";
import { getOrgPublicBrand } from "@/lib/brand/org-brand";
import { buildWhatsAppChatUrl } from "@/lib/share/whatsapp";
import { env } from "@/env";
import { db } from "@/lib/db";
import { transportRoutes, transportBookings, transportStops, type TransportRoute } from "@/lib/db/schema";
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
import { getRequestSession } from "@/lib/request-context";
import { canAccessEventRealtime } from "@/lib/organizations/event-access-policy";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { normalizeRole } from "@/lib/auth/rbac";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await EventService.getEventBySlug(slug);
  if (!event || event.status !== "published") {
    return { title: "Evento", robots: { index: false, follow: false } };
  }
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const url = `${base}/events/${event.slug}`;
  const description =
    (event.description ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160) || `Inscríbete a ${event.title} en Enquiva.`;
  const images = event.coverImage
    ? [{ url: event.coverImage, width: 1200, height: 630, alt: event.title }]
    : undefined;

  return {
    title: event.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: event.title,
      description,
      images,
      siteName: "Enquiva",
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: event.title,
      description,
      images: event.coverImage ? [event.coverImage] : undefined,
    },
  };
}

type SerializedTransportStop = {
  id: string;
  name: string;
  latitude: string | null;
  longitude: string | null;
  sortOrder: number;
  estimatedArrivalTime: string | null;
  maxSeats: number | null;
};

type SerializedTransportRoute = {
  id: string;
  eventId: string;
  name: string;
  departurePoint: string;
  departureTime: string;
  returnTime: string | null;
  pricePerSeat: string;
  totalSeats: number;
  availableSeats: number;
  description: string | null;
  isActive: boolean;
  isRoundTrip: boolean;
  stops: SerializedTransportStop[];
};

interface EventPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { t, locale } = await getI18n();
  const { slug } = await params;
  const [event, categories] = await Promise.all([
    EventService.getEventBySlug(slug),
    getCategories(),
  ]);

  if (!event) {
    return notFound();
  }

  if (event.status === "published") {
    recordEventView(event.id);
  }

  // Fetch active transport routes if transport is enabled
  let routes: TransportRoute[] = [];
  let serializedRoutes: SerializedTransportRoute[] = [];
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

      const bookedByRoute = new Map<string, number>();
      if (routeIds.length > 0) {
        const bookedRows = await db
          .select({
            routeId: transportBookings.routeId,
            booked: sql<number>`COALESCE(SUM(${transportBookings.seats}), 0)::int`,
          })
          .from(transportBookings)
          .where(
            and(
              inArray(transportBookings.routeId, routeIds),
              sql`${transportBookings.status} != 'cancelled'`,
            ),
          )
          .groupBy(transportBookings.routeId);
        for (const row of bookedRows) {
          bookedByRoute.set(row.routeId, Number(row.booked));
        }
      }

      serializedRoutes = routes
        .map((r) => {
          const booked = bookedByRoute.get(r.id) ?? 0;
          const availableSeats = Math.max(0, Number(r.totalSeats) - booked);
          return {
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
            availableSeats,
            description: r.description,
            isActive: r.isActive,
            isRoundTrip: r.isRoundTrip ?? true,
            stops: (stopsByRoute[r.id] ?? [])
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((stop) => ({
                id: stop.id,
                name: stop.name,
                latitude: stop.latitude,
                longitude: stop.longitude,
                sortOrder: stop.sortOrder,
                estimatedArrivalTime: stop.estimatedArrivalTime
                  ? stop.estimatedArrivalTime instanceof Date
                    ? stop.estimatedArrivalTime.toISOString()
                    : String(stop.estimatedArrivalTime)
                  : null,
                maxSeats: stop.maxSeats,
              })),
          };
        })
        .filter((r) => r.availableSeats > 0);

      totalTransportSeats = routes.reduce(
        (sum, r) => sum + Number(r.totalSeats),
        0,
      );

      totalBookedTransportSeats = [...bookedByRoute.values()].reduce(
        (sum, n) => sum + n,
        0,
      );
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

  const session = await getRequestSession();

  let registrationData = null;
  try {
    registrationData = await getRegistrationForEvent(event.id);
  } catch {
    registrationData = null;
  }

  const isAuthenticated = Boolean(session?.user);
  const registration = registrationData?.registration;
  const ticket = registrationData?.ticket;
  const [paymentForRegistration, capacitySnap] = await Promise.all([
    registration && session?.user
      ? getPaymentForRegistration(registration.id).catch(() => null)
      : Promise.resolve(null),
    getEventCapacitySnapshot(event.id, event.capacity, {
      organizerId: event.organizerId,
    }),
  ]);

  let viewerOrganizationId: string | null = null;
  const viewerRole = session?.user ? normalizeRole(session.user.role) : null;
  if (session?.user && (viewerRole === "admin" || viewerRole === "scanner")) {
    const org = await OrganizationService.getOrganizationForUser(session.user.id);
    viewerOrganizationId = org?.id ?? null;
  }
  const activeRegistration =
    registration &&
    ["registered", "checked_in", "waitlisted"].includes(registration.status);
  const enablePresence = Boolean(
    session?.user &&
      canAccessEventRealtime(
        {
          organizerId: event.organizerId,
          organizationId: event.organizationId,
          registeredUserIds: activeRegistration ? [session.user.id] : [],
        },
        {
          id: session.user.id,
          role: session.user.role,
          organizationId: viewerOrganizationId,
        },
      ),
  );
  const isFull = capacitySnap.isFull;
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
  const orgBrand = await getOrgPublicBrand(event.organizationId);
  const waContactUrl = orgBrand?.whatsappNumber
    ? buildWhatsAppChatUrl({
        phone: orgBrand.whatsappNumber,
        text:
          locale === "en"
            ? `Hi! I'm interested in ${event.title}.`
            : `¡Hola! Me interesa el evento ${event.title}.`,
      })
    : null;

  return (
    <div
      className="min-h-screen bg-background pb-12"
      style={
        orgBrand?.active && orgBrand.accentColor
          ? ({ ["--primary"]: orgBrand.accentColor } as Record<string, string>)
          : undefined
      }
    >
      <PublicHeader />

      <section className="relative overflow-hidden border-b border-border fe-gradient-mesh px-4 py-8 md:py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-12">
            {/* LEFT COLUMN: Main Info */}
            <div className="space-y-6 md:space-y-8">
              {/* Category Badge & Title */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex rounded-xl px-3 py-1 text-xs font-bold uppercase tracking-wider border",
                      categoryMeta?.colorClass || categoryColor(event.category),
                    )}
                  >
                    {categoryLabel(event.category, locale)}
                  </span>
                  {orgBrand?.active && orgBrand.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={orgBrand.logoUrl}
                      alt={orgBrand.name}
                      className="h-8 w-auto max-w-[140px] object-contain"
                    />
                  ) : null}
                  {waContactUrl ? (
                    <a
                      href={waContactUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-200"
                    >
                      WhatsApp
                    </a>
                  ) : null}
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
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                          {event.schedules && event.schedules.length > 1 ? "Horarios Disponibles" : "Fecha y Hora"}
                        </span>
                        {event.schedules && event.schedules.length > 1 && (
                          <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-300">
                            {event.schedules.length} turnos
                          </span>
                        )}
                      </div>
                      {event.schedules && event.schedules.length > 1 ? (
                        <div className="space-y-1.5 pt-1">
                          {event.schedules.map((slot, sIdx) => (
                            <div
                              key={slot.id || sIdx}
                              className="rounded-lg border border-border/60 bg-card/60 px-2.5 py-1.5 text-xs text-foreground flex items-center justify-between gap-2"
                            >
                              <span className="font-semibold text-primary truncate">
                                {slot.label || `Horario ${sIdx + 1}`}
                              </span>
                              <span className="text-muted-foreground font-mono text-[11px] shrink-0">
                                {slot.date ? formatEventDate(slot.date) : "—"}
                                {slot.endDate ? ` - ${formatEventDate(slot.endDate).split("•")[1] ?? formatEventDate(slot.endDate)}` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="font-semibold text-foreground text-sm leading-tight block">
                          {formatEventDate(event.date)}
                        </span>
                      )}
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

                  {/* Capacity (live) */}
                  <div className="flex gap-4 p-4 rounded-2xl border border-border/50 bg-background/50 hover:bg-background transition-colors">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <LiveAttendeeCount
                        eventId={event.id}
                        initialCount={capacitySnap.occupied}
                        initialWaitlisted={capacitySnap.waitlisted}
                        capacity={capacitySnap.capacity}
                        variant="detail"
                      />
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

                {!event.isVirtual &&
                  event.latitude != null &&
                  event.longitude != null && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Mapa del lugar
                      </h4>
                      <EventLocationMapDynamic
                        latitude={event.latitude}
                        longitude={event.longitude}
                        locationLabel={event.location}
                      />
                    </div>
                  )}
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
                eventSlug={event.slug}
                schedules={
                  event.schedules
                    ? event.schedules.map((s) => ({
                        id: s.id,
                        label: s.label ?? null,
                        date: String(s.date),
                        endDate: s.endDate ? String(s.endDate) : null,
                      }))
                    : null
                }
              />

              {/* ASISTENTES */}
              <div className="fe-glass rounded-3xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <LiveAttendeeCount
                  eventId={event.id}
                  initialCount={capacitySnap.occupied}
                  initialWaitlisted={capacitySnap.waitlisted}
                  capacity={capacitySnap.capacity}
                  variant="sidebar"
                />
              </div>
              {enablePresence && session?.user ? (
                <EventPresenceIndicator
                  eventId={event.id}
                  currentUserId={session.user.id}
                  variant="staff"
                />
              ) : null}

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

              {/* ACCESOS RÁPIDOS (panel member; staff usa la página pública / checkout) */}
              {isAuthenticated && session?.user?.role === "member" && (
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
            paymentStatus={paymentForRegistration?.payment?.status}
            paymentReceiptUrl={paymentForRegistration?.payment?.receiptUrl}
            paymentMethod={paymentForRegistration?.payment?.method}
          />
        </section>
      )}
    </div>
  );
}
