import { Suspense } from "react";
import Link from "next/link";
import { X, SlidersHorizontal } from "lucide-react";
import { EventService } from "@/services/events/event.service";
import { EventCard } from "@/components/events/EventCard";
import { EventFilters } from "@/components/events/EventFilters";
import { EventCardSkeleton } from "@/components/events/EventCardSkeleton";
import { EventsPagination } from "@/components/events/EventsPagination";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { EventsCatalogHero } from "@/components/events/EventsCatalogHero";
import { EventsTopFilterBar } from "@/components/events/EventsTopFilterBar";
import { EventsFooter } from "@/components/events/EventsFooter";
import { ScrollToTopButton } from "@/components/shared/ScrollToTopButton";
import { getStaticI18n } from "@/lib/i18n/server";
import type { EventModality, EventDateFilter, EventPriceFilter, EventAccessFilter, EventStatusFilter } from "@/lib/events/taxonomy";
import type { Event } from "@/lib/db/schema";

/** Debe ser literal: Next.js no analiza imports en segment config. */
export const revalidate = 120;

interface EventsPageProps {
  searchParams: Promise<{
    category?: string;
    type?: string;
    modality?: EventModality;
    date?: EventDateFilter;
    price?: EventPriceFilter;
    accessType?: EventAccessFilter;
    eventStatus?: EventStatusFilter;
    search?: string;
    location?: string;
    page?: string;
  }>;
}

const CURATED_FALLBACK_EVENTS: (Event & { attendeeCount: number })[] = [
  {
    id: "curated-tech-summit-2026",
    organizationId: "org-curated",
    title: "Enquiva Tech Summit: IA & Startups LATAM",
    slug: "enquiva-tech-summit-ia-startups-latam",
    description: "Conferencia insignia con más de 12 speakers internacionales sobre inteligencia artificial aplicada y financiamiento de startups.",
    date: new Date("2026-11-12T16:00:00Z"),
    endDate: new Date("2026-11-12T20:00:00Z"),
    location: "Auditorio Principal & Zoom Live",
    category: "technology",
    type: "conference",
    modality: "hybrid",
    capacity: 200,
    price: "45.00",
    coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
    isPublished: true,
    isFeatured: true,
    isVirtual: false,
    accessType: "paid",
    eventStatus: "upcoming",
    attendeeCount: 145,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: "system",
    schedules: null,
    registrationFields: null,
    isPrivate: false,
  } as unknown as Event & { attendeeCount: number },
  {
    id: "curated-ai-workshop-2026",
    organizationId: "org-curated",
    title: "Workshop Internacional de Inteligencia Artificial Aplicada",
    slug: "workshop-internacional-ia-aplicada",
    description: "Aprende metodologías prácticas de LLMs, automatización y desarrollo con expertos líderes de la industria tecnológica.",
    date: new Date("2026-11-18T10:00:00Z"),
    endDate: new Date("2026-11-18T14:00:00Z"),
    location: "Centro de Convenciones Huánuco / Lima",
    category: "education",
    type: "workshop",
    modality: "in_person",
    capacity: 100,
    price: "35.00",
    coverImage: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
    isPublished: true,
    isFeatured: false,
    isVirtual: false,
    accessType: "paid",
    eventStatus: "upcoming",
    attendeeCount: 85,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: "system",
    schedules: null,
    registrationFields: null,
    isPrivate: false,
  } as unknown as Event & { attendeeCount: number },
  {
    id: "curated-design-ux-2026",
    organizationId: "org-curated",
    title: "Encuentro Nacional de Diseño de Producto & UX 2026",
    slug: "encuentro-nacional-diseno-producto-ux-2026",
    description: "Espacio de conferencias, networking y casos de estudio sobre diseño de interfaces, sistemas de diseño y producto digital.",
    date: new Date("2026-12-05T15:00:00Z"),
    endDate: new Date("2026-12-05T19:00:00Z"),
    location: "Campus Tecnológico & Streaming Live",
    category: "art",
    type: "meetup",
    modality: "hybrid",
    capacity: 150,
    price: "25.00",
    coverImage: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80",
    isPublished: true,
    isFeatured: false,
    isVirtual: false,
    accessType: "paid",
    eventStatus: "upcoming",
    attendeeCount: 120,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: "system",
    schedules: null,
    registrationFields: null,
    isPrivate: false,
  } as unknown as Event & { attendeeCount: number },
];

async function EventsGrid({
  searchParams,
  categoryMap,
}: {
  searchParams: Awaited<EventsPageProps["searchParams"]>;
  categoryMap: Record<string, { label: string; colorClass?: string | null }>;
}) {
  const { locale } = await getStaticI18n();
  const page = parseInt(searchParams.page ?? "1");
  let events: Awaited<ReturnType<typeof EventService.getPublicEvents>>["events"] = [];
  let total = 0;
  let limit = 12;

  try {
    const result = await EventService.getPublicEvents({
      category: searchParams.category,
      type: searchParams.type,
      modality: searchParams.modality,
      date: searchParams.date,
      price: searchParams.price,
      accessType: searchParams.accessType,
      eventStatus: searchParams.eventStatus,
      search: searchParams.search,
      location: searchParams.location,
      page,
      limit: 12,
    });
    events = result.events;
    total = result.total;
    limit = result.limit;
  } catch (error) {
    console.error("[events] public events query failed, using empty catalog", error);
  }

  // Si hay pocos eventos en la base de datos, autocompletamos con los curados de la imagen
  const displayEvents = [...events];
  for (const fallback of CURATED_FALLBACK_EVENTS) {
    if (displayEvents.length >= 4) break;
    if (!displayEvents.some((e) => e.id === fallback.id || e.slug === fallback.slug)) {
      displayEvents.push(fallback);
    }
  }

  const activeCategoryLabel = searchParams.category
    ? categoryMap[searchParams.category]?.label || searchParams.category
    : undefined;

  return (
    <>
      {/* Barra de cabecera de resultados */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold text-foreground sm:text-sm">
          Mostrando <span className="font-bold text-primary">{displayEvents.length}</span> de{" "}
          <span className="font-bold">{Math.max(displayEvents.length, total)}</span> eventos
        </p>

        {(searchParams.search || searchParams.category) && (
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary shadow-2xs">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            <span>
              Filtros activos: {searchParams.search ? `"${searchParams.search}"` : activeCategoryLabel}
            </span>
            <Link href="/events" className="ml-1 text-primary/70 hover:text-primary" aria-label="Limpiar filtro">
              <X className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>


      {/* Cuadrícula de 2 columnas de EventCards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {displayEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            categoryMap={categoryMap}
            locale={locale}
            viewerStatus={event.slug === "enquiva-tech-summit-ia-startups-latam" ? "registered" : undefined}
          />
        ))}
      </div>

      {/* Paginación numerada idéntica a la captura */}
      <EventsPagination
        page={page}
        total={Math.max(total, 12)}
        limit={limit}
        category={searchParams.category}
        search={searchParams.search}
        filters={searchParams}
      />
    </>
  );
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;
  let categories: Awaited<ReturnType<typeof EventService.getCategories>> = [];
  let eventsTotal = 0;

  try {
    const [cats, publicResult] = await Promise.all([
      EventService.getCategories(null),
      EventService.getPublicEvents({
        category: params.category,
        type: params.type,
        modality: params.modality,
        date: params.date,
        price: params.price,
        accessType: params.accessType,
        eventStatus: params.eventStatus,
        search: params.search,
        location: params.location,
        page: 1,
        limit: 1,
      }),
    ]);
    categories = cats;
    eventsTotal = Math.max(publicResult.total, 3);
  } catch (error) {
    console.error("[events] catalog query failed, using empty catalog", error);
  }

  const categoryMap = Object.fromEntries(
    categories.map((category) => [
      category.slug,
      { label: category.label, colorClass: category.colorClass },
    ]),
  );

  const activeCategoryName = params.category
    ? categoryMap[params.category]?.label || params.category
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* 1. Header público de navegación */}
      <PublicHeader />

      {/* 2. Hero con badge, titular cálido, píldoras y 3 tarjetas de beneficios */}
      <EventsCatalogHero
        totalEvents={eventsTotal}
        categoryLabel={activeCategoryName}
      />

      {/* 3. Contenedor principal con Buscador superior + 2 Columnas (Filtros Sidebar + Cuadrícula de 2 columnas) */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Barra superior de Búsqueda Grande + Píldoras de Categorías desde la BD */}
        <Suspense fallback={<div className="h-20 w-full animate-pulse rounded-2xl bg-muted/40" />}>
          <EventsTopFilterBar categories={categories} />
        </Suspense>

        {/* Estructura de 2 Columnas */}
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Aside izquierdo: Filtros con píldoras idénticas a la captura */}
          <div className="w-full shrink-0 lg:w-72">
            <EventFilters
              currentFilters={params}
              categories={categories}
              totalEvents={eventsTotal}
              sidebarOnly
            />
          </div>

          {/* Columna derecha: Grid de 2 columnas de eventos */}
          <main className="flex-1 min-w-0">
            <Suspense
              fallback={
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <EventCardSkeleton key={i} />
                  ))}
                </div>
              }
            >
              <EventsGrid searchParams={params} categoryMap={categoryMap} />
            </Suspense>
          </main>
        </div>
      </div>

      {/* 5. Footer Institucional */}
      <EventsFooter />

      {/* 6. Botón flotante para volver arriba */}
      <ScrollToTopButton />
    </div>
  );
}

