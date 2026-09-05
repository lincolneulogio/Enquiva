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
import { EventsFooter } from "@/components/events/EventsFooter";
import { ScrollToTopButton } from "@/components/shared/ScrollToTopButton";
import { EventDetailSchedules } from "@/components/events/EventDetailSchedules";
import { EventDetailMetrics } from "@/components/events/EventDetailMetrics";
import { EventDetailSidebar } from "@/components/events/EventDetailSidebar";
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

  // Ubicación desglosada
  const rawLocation =
    event.location ||
    "Parque Plaza de Armas, Jirón General Prado, Loma Blanca, Huánuco";
  const [firstPart, ...restParts] = rawLocation.split(",");
  const locationName = firstPart.trim();
  const locationAddress =
    restParts.length > 0 ? restParts.join(",").trim() : "Huánuco, Perú";

  // Categoría en mayúsculas con punto naranja
  const categoryUpper = (
    categoryMeta?.label ||
    event.category ||
    "Negocios y Emprendimiento"
  ).toUpperCase();

  // Fecha completa formateada en español
  const fullDateStr = new Date(event.date).toLocaleDateString(
    locale === "en" ? "en-US" : "es-PE",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
  const displayFormattedDate =
    fullDateStr.charAt(0).toUpperCase() + fullDateStr.slice(1);

  // Portada fallback de alta resolución si no hay coverImage cargada
  const displayCoverImage =
    event.coverImage ||
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80";

  // Turnos para EventDetailSchedules
  const schedulesForDisplay =
    event.schedules && event.schedules.length > 0
      ? event.schedules.map((slot, index) => {
          const slotDate = slot.date
            ? new Date(slot.date)
            : new Date(event.date);
          const startTimeStr = slotDate.toLocaleTimeString(
            locale === "en" ? "en-US" : "es-PE",
            { hour: "2-digit", minute: "2-digit", hour12: true },
          );
          const endTimeStr = slot.endDate
            ? new Date(slot.endDate).toLocaleTimeString(
                locale === "en" ? "en-US" : "es-PE",
                { hour: "2-digit", minute: "2-digit", hour12: true },
              )
            : "12:30 PM";
          const isSelected = index === 0;
          return {
            id: slot.id || `slot-${index}`,
            label:
              slot.label ||
              (index === 0
                ? "Turno Mañana"
                : index === 1
                  ? "Turno Tarde"
                  : "Turno Noche"),
            timeRange: `${startTimeStr} - ${endTimeStr}`,
            description:
              index === 0
                ? "Conferencias magistrales y apertura"
                : index === 1
                  ? "Talleres prácticos en innovación"
                  : "Networking & Pitch de proyectos",
            badgeText: isSelected
              ? "Seleccionado"
              : index === 1
                ? "Cupos disponibles"
                : "Acceso VIP / Networking",
            badgeVariant: (isSelected
              ? "selected"
              : index === 1
                ? "available"
                : "vip") as "selected" | "available" | "vip",
          };
        })
      : undefined;

  return (
    <div
      className="min-h-screen bg-[#FAF7F2] text-foreground transition-colors dark:bg-background"
      style={
        orgBrand?.active && orgBrand.accentColor
          ? ({ ["--primary"]: orgBrand.accentColor } as Record<string, string>)
          : undefined
      }
    >
      {/* Header público de navegación */}
      <PublicHeader />

      {/* 3. Contenedor Principal (Layout de 2 Columnas idéntico a la imagen de referencia) */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_360px] lg:gap-8 xl:grid-cols-[1fr_380px]">
          {/* COLUMNA IZQUIERDA: Píldora categoría, Título, Portada, Acerca de, Información del Evento, Mapa */}
          <div className="min-w-0 space-y-6">
            {/* Píldora de Categoría & Titular Grande */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/90 px-3.5 py-1 text-xs font-bold tracking-wide text-foreground/80 uppercase shadow-2xs dark:bg-card/90">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span>{categoryUpper}</span>
              </div>

              <h1 className="font-display text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.15]">
                {event.title}
              </h1>
            </div>

            {/* Portada en alta resolución con Badges en esquina inferior izquierda */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] max-h-[460px] overflow-hidden rounded-2xl border border-border/70 bg-muted/40 shadow-sm sm:rounded-3xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayCoverImage}
                alt={event.title}
                className="h-full w-full object-cover object-center"
              />

              {/* Badges superpuestos idénticos a la captura */}
              <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00C06D] px-3.5 py-1.5 text-xs font-bold text-white shadow-md">
                  <span className="h-2 w-2 rounded-full bg-white" />
                  INSCRIPCIONES ABIERTAS
                </span>
                <span className="inline-flex items-center rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-bold text-zinc-900 shadow-md backdrop-blur-xs dark:bg-card/95 dark:text-zinc-100">
                  {event.isVirtual
                    ? "Edición Virtual Oficial"
                    : "Edición Presencial Oficial"}
                </span>
              </div>
            </div>

            {/* Tarjeta: Acerca de esta conferencia */}
            <div className="space-y-2 rounded-2xl border border-border/80 bg-white p-6 shadow-xs dark:bg-card">
              <h2 className="text-base font-bold text-foreground sm:text-lg">
                Acerca de esta conferencia
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {event.description ||
                  "Un encuentro dirigido a emprendedores, estudiantes, profesionales y personas interesadas en desarrollar nuevas ideas de negocio. Durante el evento se realizarán conferencias, talleres prácticos y espacios de networking con especialistas en emprendimiento, marketing digital, tecnología e innovación."}
              </p>
            </div>

            {/* Tarjeta: Información del Evento */}
            <div className="space-y-6 rounded-2xl border border-border/80 bg-white p-6 shadow-xs sm:p-8 dark:bg-card">
              {/* Cabecera */}
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Clock className="h-4 w-4" />
                  </span>
                  <h3 className="font-display text-lg font-bold text-foreground sm:text-xl">
                    Información del Evento
                  </h3>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Valores actualizados en vivo
                </span>
              </div>

              {/* 1. Fecha y Horarios Disponibles */}
              <EventDetailSchedules
                formattedDate={displayFormattedDate}
                eventTitle={event.title}
                eventDescription={event.description}
                eventLocation={rawLocation}
                schedules={schedulesForDisplay}
              />

              {/* 2. Tres Tarjetas de Métricas (Ubicación, Capacidad, Costo) */}
              <EventDetailMetrics
                locationName={locationName}
                locationAddress={locationAddress}
                occupied={capacitySnap.occupied}
                capacity={capacitySnap.capacity}
                price={event.price}
                isVirtual={event.isVirtual}
              />

              {/* 3. Mapa del Lugar */}
              {!event.isVirtual && (
                <EventLocationMapDynamic
                  latitude={event.latitude ?? -9.9306}
                  longitude={event.longitude ?? -76.2422}
                  locationLabel={rawLocation}
                />
              )}
            </div>

            {/* Servicio de Transporte (si el evento lo ofrece) */}
            {event.hasTransport && routes.length > 0 && (
              <div className="space-y-6 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-50/50 via-background to-indigo-50/30 p-6 shadow-md backdrop-blur-sm sm:p-8 dark:from-blue-950/10 dark:via-background dark:to-indigo-950/5">
                <div className="flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="font-display text-lg font-bold text-foreground sm:text-xl flex items-center gap-2">
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
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/30 bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-600 shadow-sm dark:text-blue-400">
                      <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                      Costo Adicional
                    </span>
                  </div>
                </div>

                {/* Warning Alert */}
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200/50 bg-amber-50/85 p-4 shadow-sm dark:border-amber-900/30 dark:bg-amber-950/20">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <div className="space-y-1 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
                    <p className="font-bold text-amber-800 dark:text-amber-400">
                      ¡El transporte NO está incluido en la entrada!
                    </p>
                    <p>
                      El precio de la <strong>Entrada al Evento</strong> es
                      independiente del costo del transporte. Los precios
                      indicados en las rutas son <strong>por asiento</strong> y
                      corresponden al pasaje de traslado. Deberás seleccionarlo
                      y pagarlo al momento de tu registro.
                    </p>
                  </div>
                </div>

                {/* Routes List */}
                <div className="space-y-4 pt-2">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Route className="h-4 w-4 text-primary" />
                    Rutas y Puntos de Salida Disponibles
                  </h4>

                  <div className="grid gap-4">
                    {routes.map((route) => (
                      <div
                        key={route.id}
                        className="group flex flex-col justify-between gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/30 md:flex-row md:items-center"
                      >
                        <div className="space-y-3">
                          <div>
                            <h5 className="flex items-center gap-1.5 text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                              {route.name}
                            </h5>
                            {route.description && (
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {route.description}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-xs text-muted-foreground sm:grid-cols-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 shrink-0 text-blue-500" />
                              <span>
                                <strong>Partida:</strong> {route.departurePoint}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 shrink-0 text-blue-500" />
                              <span>
                                <strong>Salida:</strong>{" "}
                                {formatRouteDateTime(route.departureTime)}
                              </span>
                            </div>
                            {route.returnTime && (
                              <div className="mt-1 flex items-center gap-2 border-t border-border/40 pt-2 sm:col-span-2">
                                <ArrowRight className="h-4 w-4 shrink-0 text-emerald-500" />
                                <span>
                                  <strong>Retorno estimado:</strong>{" "}
                                  {formatRouteDateTime(route.returnTime)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-row items-center justify-between gap-2 border-t border-border/60 pt-4 md:flex-col md:items-end md:justify-center md:border-t-0 md:pt-0">
                          <span className="text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">
                            Pasaje por asiento
                          </span>
                          <span className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-1.5 text-lg font-bold text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                            S/ {Number(route.pricePerSeat).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: Sticky Sidebar con Registrarme ahora, Asistentes, Viendo ahora, Organizador y Garantías */}
          <div className="space-y-4 md:sticky md:top-6 lg:top-6">
            <EventDetailSidebar
              eventId={event.id}
              eventSlug={event.slug}
              eventPrice={event.price ? Number(event.price) : 0}
              occupied={capacitySnap.occupied}
              capacity={capacitySnap.capacity}
              isAuthenticated={isAuthenticated}
              isRegistrationClosed={isRegistrationClosed}
              waitlistAvailable={waitlistAvailable}
              closedReason={registrationClosedReason}
              hasTransport={event.hasTransport}
              currentStatus={registration?.status}
              registrationId={registration?.id}
              transportRoutes={serializedRoutes}
              paymentStatus={paymentForRegistration?.payment?.status}
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
              organizerName={orgBrand?.name || "Operaciones Enquiva"}
              organizerDescription="Nos encargamos de la logística, pagos y soporte."
              waContactUrl={waContactUrl}
            />
          </div>
        </div>
      </div>

      {/* Tarjeta de Ticket si el usuario ya cuenta con inscripción activa */}
      {registration && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
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

      {/* 4. Footer institucional con las columnas idénticas a la imagen */}
      <EventsFooter />

      {/* 5. Botón flotante para volver arriba reactivo a los acentos */}
      <ScrollToTopButton />
    </div>
  );
}
