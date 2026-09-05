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

/** Debe ser literal: Next.js no analiza imports en segment config. */
export const revalidate = 120;

export default async function HomePage() {
  const { locale, t } = await getStaticI18n();
  const landingCopy = getLandingCopy({ role: null, locale: locale === "en" ? "en" : "es", t });

  let events: Awaited<ReturnType<typeof EventService.getPublicEvents>>["events"] = [];
  let totalRegistrations = 0;

  try {
    const publicResult = await EventService.getPublicEvents({ page: 1, limit: 6 });
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
        {/* 1. Header / Barra de Navegación */}
        <PublicHeader />

        {/* 2. Hero Section con titular, avatares y CTAs */}
        <SessionAwareHero formattedRegistrations={formattedRegistrations} />

        {/* 3. Cuadrícula de 6 Eventos con Píldoras de Categorías (Datos reales de DB + Fallback de alta fidelidad) */}
        <EventsCatalogSection dbEvents={events} locale={locale} />

        {/* 4. Experiencias y eventos de primer nivel en Enquiva (Galería Cinema Tech + 3 Tarjetas de organizadores) */}
        <PremierExperiencesSection />

        {/* 5. Recomendados y Próximos Lanzamientos (Tiras horizontales con badges y tickets) */}
        <UpcomingLaunchesSection />

        {/* 6. Sección Oscura de Impacto y Comunidad (2 fotos gigantes, métricas +50k, CTAs) */}
        <ImpactCommunitySection />

        {/* 7. Testimonios: Tú puedes ser la próxima historia de éxito (3 tarjetas con 5 estrellas) */}
        <SuccessStoriesSection />

        {/* 8. Footer Integral */}
        <Footer copy={landingCopy} />

        {/* 9. Botón flotante Scroll To Top */}
        <ScrollToTopButton />
      </div>
    </MarketingMotionProvider>
  );
}
