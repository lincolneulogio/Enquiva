import { Suspense } from "react";
import { Calendar, Bus, CreditCard } from "lucide-react";
import { EventService } from "@/services/events/event.service";
import { EventCard } from "@/components/events/EventCard";
import { EventFilters } from "@/components/events/EventFilters";
import { EventCardSkeleton } from "@/components/events/EventCardSkeleton";
import { EventsPagination } from "@/components/events/EventsPagination";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { PublicPageHero } from "@/components/shared/PublicPageHero";
import { ScrollToTopButton } from "@/components/shared/ScrollToTopButton";
import { getStaticI18n } from "@/lib/i18n/server";
import type { EventModality, EventDateFilter, EventPriceFilter, EventAccessFilter, EventStatusFilter } from "@/lib/events/taxonomy";

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
  const { t, locale } = await getStaticI18n();
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

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-muted/20 py-24 text-center">
        <div className="mb-4 text-6xl opacity-20">✦</div>
        <h3 className="font-display text-2xl font-semibold text-foreground">
          {t("public.events.noEventsFound")}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("public.events.adjustFilters")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          {t("public.events.showingEvents", { count: events.length, total })}
        </p>
      </div>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            categoryMap={categoryMap}
            locale={locale}
          />
        ))}
      </div>
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
  const { t } = await getStaticI18n();
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
    eventsTotal = publicResult.total;
  } catch (error) {
    console.error("[events] catalog query failed, using empty catalog", error);
  }

  const categoryMap = Object.fromEntries(
    categories.map((category) => [
      category.slug,
      { label: category.label, colorClass: category.colorClass },
    ]),
  );

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <PublicPageHero
        badge={t("public.events.badge")}
        badgeIcon={Calendar}
        title={t("public.events.titleStart")}
        titleHighlight={t("public.events.titleHighlight")}
        description={t("public.events.subtitle")}
        highlights={[
          {
            icon: CreditCard,
            title: t("public.events.highlightPayTitle"),
            description: t("public.events.highlightPayDesc"),
          },
          {
            icon: Calendar,
            title: t("public.events.highlightTicketsTitle"),
            description: t("public.events.highlightTicketsDesc"),
          },
          {
            icon: Bus,
            title: t("public.events.highlightTransportTitle"),
            description: t("public.events.highlightTransportDesc"),
          },
        ]}
      >
        <div className="mt-7 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-semibold text-foreground">
            {t("public.events.statEvents", { count: eventsTotal })}
          </span>
          <span className="rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-semibold text-foreground">
            {t("public.events.statCategories", { count: categories.length })}
          </span>
        </div>
      </PublicPageHero>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Aside de filtros desktop */}
          <div className="w-full shrink-0 lg:w-72">
            <EventFilters
              currentFilters={params}
              categories={categories}
              totalEvents={eventsTotal}
            />
          </div>

          {/* Grid principal de eventos */}
          <main className="flex-1 min-w-0">
            <Suspense
              fallback={
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
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

      <ScrollToTopButton />
    </div>
  );
}
