import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories } from "@/actions/events";
import { EventService } from "@/services/events/event.service";
import { getRegistrationForEvent } from "@/actions/registrations";
import { getPaymentForRegistration } from "@/actions/payments";
import { TicketCard } from "@/components/tickets/TicketCard";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { EventsFooter } from "@/components/events/EventsFooter";
import { ScrollToTopButton } from "@/components/shared/ScrollToTopButton";
import { EventDetailSchedules } from "@/components/events/EventDetailSchedules";
import { EventDetailMetrics } from "@/components/events/EventDetailMetrics";
import { EventDetailSidebar } from "@/components/events/EventDetailSidebar";
import { EventLocationMapDynamic } from "@/components/events/EventLocationMapDynamic";
import { categoryLabel, stripHtml } from "@/lib/utils";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { getI18n } from "@/lib/i18n/server";
import { recordEventView } from "@/lib/analytics/event-views";
import { getEventCapacitySnapshot } from "@/lib/events/capacity-snapshot";
import { getOrgPublicBrand } from "@/lib/brand/org-brand";
import { env } from "@/env";
import { Clock } from "lucide-react";
import { getRequestSession } from "@/lib/request-context";
import { fetchEventTransportData } from "./event-transport-query";
import { EventTransportSection } from "./EventTransportSection";
import { EventHeroHeader } from "./EventHeroHeader";
import {
  splitLocation,
  formatDisplayDate,
  buildSchedulesForDisplay,
  resolveWhatsAppContactUrl,
} from "./event-slug-helpers";

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

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { t, locale } = await getI18n();
  const { slug } = await params;
  const [event, categories] = await Promise.all([
    EventService.getEventBySlug(slug),
    getCategories(),
  ]);

  if (!event) return notFound();
  if (event.status === "published") recordEventView(event.id);

  const { routes, serializedRoutes } = await fetchEventTransportData(
    event.id,
    Boolean(event.hasTransport),
  );

  const categoryMeta = categories.find((c) => c.slug === event.category);
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

  const isFull = capacitySnap.isFull;
  const isEventExpired = new Date(event.date).getTime() <= Date.now();
  const isRegistrationClosed = isEventExpired || event.status !== "published";
  const waitlistAvailable = isFull && !isEventExpired && event.status === "published";
  const registrationClosedReason = isEventExpired
    ? t("register.eventExpired")
    : event.status !== "published"
      ? t("register.registrationUnavailable")
      : null;

  const orgBrand = await getOrgPublicBrand(event.organizationId);
  const waContactUrl = await resolveWhatsAppContactUrl(event, orgBrand, locale);

  const { rawLocation, locationName, locationAddress } = splitLocation(event.location);
  const rawCategory = categoryMeta?.label || categoryLabel(event.category, locale);
  const categoryUpper = (rawCategory ? rawCategory.replace(/_/g, " ") : "Negocios y Emprendimiento").toUpperCase();
  const displayFormattedDate = formatDisplayDate(event.date, locale);
  const displayCoverImage = event.coverImage || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80";
  const schedulesForDisplay = buildSchedulesForDisplay(event, locale);

  return (
    <div
      className="min-h-screen bg-[#FAF7F2] text-foreground transition-colors dark:bg-background"
      style={orgBrand?.active && orgBrand.accentColor ? ({ ["--primary"]: orgBrand.accentColor } as Record<string, string>) : undefined}
    >
      <PublicHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_360px] lg:gap-8 xl:grid-cols-[1fr_380px]">
          <div className="min-w-0 space-y-6">
            <EventHeroHeader
              categoryUpper={categoryUpper}
              eventTitle={event.title}
              displayCoverImage={displayCoverImage}
              isVirtual={Boolean(event.isVirtual)}
            />

            <div className="space-y-3 rounded-2xl border border-border/80 bg-white p-6 shadow-xs dark:bg-card">
              <h2 className="text-base font-bold text-foreground sm:text-lg">Acerca de esta conferencia</h2>
              <RichTextContent
                content={event.description}
                fallback="Un encuentro dirigido a emprendedores, estudiantes y profesionales interesados en desarrollar nuevas ideas de negocio."
              />
            </div>

            <div className="space-y-6 rounded-2xl border border-border/80 bg-white p-6 shadow-xs sm:p-8 dark:bg-card">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Clock className="h-4 w-4" />
                  </span>
                  <h3 className="font-display text-lg font-bold text-foreground sm:text-xl">Información del Evento</h3>
                </div>
                <span className="text-xs font-medium text-muted-foreground">Valores actualizados en vivo</span>
              </div>

              <EventDetailSchedules
                formattedDate={displayFormattedDate}
                eventTitle={event.title}
                eventDescription={event.description}
                eventLocation={rawLocation}
                schedules={schedulesForDisplay}
              />

              <EventDetailMetrics
                locationName={locationName}
                locationAddress={locationAddress}
                occupied={capacitySnap.occupied}
                capacity={capacitySnap.capacity}
                price={event.price}
                isVirtual={event.isVirtual}
                hasCertificate={event.hasCertificate}
                certificateTitle={event.certificateTitle}
              />

              {!event.isVirtual && (
                <EventLocationMapDynamic
                  latitude={event.latitude ?? -9.9306}
                  longitude={event.longitude ?? -76.2422}
                  locationLabel={rawLocation}
                />
              )}
            </div>

            {event.hasTransport && routes.length > 0 && (
              <EventTransportSection routes={routes} locale={locale} />
            )}
          </div>

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
              holdExpiresAt={registration?.holdExpiresAt ? (registration.holdExpiresAt instanceof Date ? registration.holdExpiresAt.toISOString() : String(registration.holdExpiresAt)) : null}
              schedules={event.schedules ? event.schedules.map((s) => ({ id: s.id, label: s.label ?? null, date: String(s.date), endDate: s.endDate ? String(s.endDate) : null })) : null}
              organizerName={orgBrand?.name || "Operaciones Enquiva"}
              organizerDescription="Nos encargamos de la logística, pagos y soporte."
              waContactUrl={waContactUrl}
              hasCertificate={Boolean(event.hasCertificate)}
              certificateTitle={event.certificateTitle ?? null}
              certificatePrice={event.certificatePrice ? Number(event.certificatePrice) : 0}
            />
          </div>
        </div>
      </div>

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

      <EventsFooter />
      <ScrollToTopButton />
    </div>
  );
}
