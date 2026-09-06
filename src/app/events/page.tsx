import { Suspense } from "react";
import Link from "next/link";
import { X, SlidersHorizontal, Calendar } from "lucide-react";
import { EventService } from "@/services/events/event.service";
import { EventCard } from "@/components/events/EventCard";
import { EventFilters } from "@/components/events/EventFilters";
import { EventCardSkeleton } from "@/components/events/EventCardSkeleton";
import { EventsPagination } from "@/components/events/EventsPagination";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { EventsCatalogHero } from "@/components/events/EventsCatalogHero";
import { EventsTopFilterBar } from "@/components/events/EventsTopFilterBar";
import { EventsFooter } from "@/components/events/EventsFooter";
import { EventsCatalogRealtimeSync } from "@/components/events/EventsCatalogRealtimeSync";
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

  const activeCategoryLabel = searchParams.category
    ? categoryMap[searchParams.category]?.label || searchParams.category
    : undefined;

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Calendar className="h-7 w-7" />
        </div>
        <h3 className="font-display text-lg font-bold text-foreground sm:text-xl">
          No se encontraron eventos
        </h3>
        <p className="mt-1 max-w-md text-xs text-muted-foreground sm:text-sm">
          No hay eventos que coincidan con los filtros seleccionados. Intenta ajustar tu búsqueda o explorar otras categorías.
        </p>
        <Link
          href="/events"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:bg-primary/95"
        >
          Ver todos los eventos
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Barra de cabecera de resultados */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold text-foreground sm:text-sm">
          Mostrando <span className="font-bold text-primary">{events.length}</span> de{" "}
          <span className="font-bold">{total}</span> eventos
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

      {/* Cuadrícula de EventCards reales de la base de datos */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            categoryMap={categoryMap}
            locale={locale}
          />
        ))}
      </div>

      {/* Paginación numerada real */}
      <EventsPagination
        page={page}
        total={total}
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
  let heroFeatures = { hasCulqi: false, hasTransport: true, hasQrTickets: true };

  try {
    const [cats, publicResult, features] = await Promise.all([
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
      EventService.getCatalogHeroFeatures(),
    ]);
    categories = cats;
    eventsTotal = publicResult.total;
    heroFeatures = features;
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
      <EventsCatalogRealtimeSync />

      {/* 2. Hero con badge, titular cálido, píldoras y 3 tarjetas de beneficios dinámicas */}
      <EventsCatalogHero
        totalEvents={eventsTotal}
        categoryLabel={activeCategoryName}
        hasCulqi={heroFeatures.hasCulqi}
        hasTransport={heroFeatures.hasTransport}
        hasQrTickets={heroFeatures.hasQrTickets}
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

