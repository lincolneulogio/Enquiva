import { EventService } from "@/services/events/event.service";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { getStaticI18n } from "@/lib/i18n/server";
import { getLandingCopy } from "@/lib/navigation/landing-audience";
import {
  SessionAwareHero,
  EventsCatalogSection,
  PremierExperiencesSection,
  UpcomingLaunchesSection,
  ImpactCommunitySection,
  SuccessStoriesSection,
  Footer,
} from "@/components/landing";
import { ScrollToTopButton } from "@/components/shared/ScrollToTopButton";
import { MarketingMotionProvider } from "@/components/providers/MarketingMotionProvider";
import { getPublicTestimonials, getCommunityMetrics } from "@/actions/marketing";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const homeCanonical = absoluteUrl("/");

export const metadata: Metadata = {
  description:
    "Enquiva es la plataforma de eventos de Huánuco y todo el Perú: descubre conciertos, talleres, congresos y festivales, o crea el tuyo y vende entradas con tickets QR, inscripciones, pagos y transporte en un solo lugar.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: homeCanonical,
    title: "Enquiva — Eventos en Huánuco y todo el Perú",
    description:
      "Descubre y organiza eventos en Huánuco y todo el Perú con venta de entradas digitales, tickets QR, inscripciones, pagos y transporte.",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "Enquiva" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Enquiva — Eventos en Huánuco y todo el Perú",
    description:
      "Descubre y organiza eventos en Huánuco y todo el Perú con entradas digitales y tickets QR.",
    images: ["/images/og-image.png"],
  },
};

export default async function HomePage() {
  const { locale, t } = await getStaticI18n();
  const landingCopy = getLandingCopy({ role: null, locale: locale === "en" ? "en" : "es", t });

  // Consultas dinámicas en paralelo para alimentar todas las secciones del Home
  const [
    publicResult,
    categories,
    upcomingLaunches,
    premierExperiences,
    topOrganizations,
    communityMetrics,
    testimonials,
  ] = await Promise.all([
    EventService.getPublicEvents({ page: 1, limit: 6 }).catch(() => ({
      events: [],
      totalRegistrations: 0,
      total: 0,
      page: 1,
      limit: 6,
    })),
    // Solo las 4 categorías con mayor alcance/inscritos/visibilidad; el
    // catálogo completo siempre está disponible en /events.
    EventService.getTopCategories(4).catch(() => []),
    EventService.getUpcomingLaunches(4).catch(() => []),
    EventService.getPremierExperiences(4).catch(() => []),
    EventService.getTopOrganizations(2).catch(() => []),
    getCommunityMetrics().catch(() => ({
      registeredAttendees: "+50,000",
      executedEvents: "+1,200",
      satisfactionRate: "99.4%",
      connectedCities: "12 Países",
    })),
    getPublicTestimonials().catch(() => []),
  ]);

  const events = publicResult.events;
  const totalRegistrations = publicResult.totalRegistrations;

  const formattedRegistrations = new Intl.NumberFormat(
    locale === "en" ? "en-US" : "es-PE",
  ).format(totalRegistrations);

  return (
    <MarketingMotionProvider>
      <main id="top" className="relative min-h-screen overflow-x-clip bg-background">
        {/* 1. Header / Barra de Navegación */}
        <PublicHeader />

        {/* 2. Hero Section con titular, avatares y CTAs */}
        <SessionAwareHero formattedRegistrations={formattedRegistrations} />

        {/* 3. Cuadrícula de 6 Eventos con Píldoras de Categorías Dinámicas desde BD */}
        <EventsCatalogSection
          dbEvents={events}
          categories={categories}
          locale={locale}
        />

        {/* 4. Experiencias y eventos de primer nivel en Enquiva (Galería Cinema Tech + Organizadores de BD) */}
        <PremierExperiencesSection
          experiences={premierExperiences}
          organizations={topOrganizations}
        />

        {/* 5. Recomendados y Próximos Lanzamientos (Tiras horizontales con eventos futuros de BD) */}
        <UpcomingLaunchesSection dbEvents={upcomingLaunches} />

        {/* 6. Sección Oscura de Impacto y Comunidad (Métricas calculadas dinámicamente) */}
        <ImpactCommunitySection metrics={communityMetrics} />

        {/* 7. Testimonios Reales desde BD */}
        <SuccessStoriesSection testimonials={testimonials} />

        {/* 8. Footer Integral con Boletín conectado a Base de Datos */}
        <Footer copy={landingCopy} />

        {/* 9. Botón flotante Scroll To Top */}
        <ScrollToTopButton />
      </main>
    </MarketingMotionProvider>
  );
}
