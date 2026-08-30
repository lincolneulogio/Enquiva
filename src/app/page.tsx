import { EventService } from "@/services/events/event.service";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { getStaticI18n } from "@/lib/i18n/server";
import { getLandingCopy } from "@/lib/navigation/landing-audience";
import {
  FeaturedEventsCarousel,
  EventsShowcase,
  FeaturesSection,
  Footer,
} from "@/components/landing";
import { SessionAwareHero } from "@/components/landing/SessionAwareHero";
import { MarketingMotionProvider } from "@/components/providers/MarketingMotionProvider";

/** Debe ser literal: Next.js no analiza imports en segment config. */
export const revalidate = 120;

export default async function HomePage() {
  const { locale, t } = await getStaticI18n();
  const landingCopy = getLandingCopy({ role: null, locale: locale === "en" ? "en" : "es", t });

  let featuredEvents: Awaited<ReturnType<typeof EventService.getFeaturedPublicEvents>> = [];
  let events: Awaited<ReturnType<typeof EventService.getPublicEvents>>["events"] = [];
  let totalRegistrations = 0;

  try {
    const [featured, publicResult] = await Promise.all([
      EventService.getFeaturedPublicEvents(8),
      EventService.getPublicEvents({ page: 1, limit: 6 }),
    ]);
    featuredEvents = featured;
    events = publicResult.events;
    totalRegistrations = publicResult.totalRegistrations;
  } catch (error) {
    console.error("[home] public events query failed, using empty catalog", error);
  }

  const formattedRegistrations = new Intl.NumberFormat(
    locale === "en" ? "en-US" : "es-PE",
  ).format(totalRegistrations);

  return (
    <MarketingMotionProvider>
      <div id="top" className="relative min-h-screen overflow-x-clip bg-background">
        <PublicHeader />

        <SessionAwareHero formattedRegistrations={formattedRegistrations} />

        <FeaturedEventsCarousel events={featuredEvents} t={t} locale={locale} />

        <EventsShowcase events={events} t={t} locale={locale} />

        <FeaturesSection t={t} copy={landingCopy} />

        <Footer t={t} copy={landingCopy} />
      </div>
    </MarketingMotionProvider>
  );
}
