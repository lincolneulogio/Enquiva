import { Suspense } from "react";
import { Calendar, Bus, CreditCard } from "lucide-react";
import { EventService } from "@/services/events/event.service";
import { EventCard } from "@/components/events/EventCard";
import { EventFilters } from "@/components/events/EventFilters";
import { EventCardSkeleton } from "@/components/events/EventCardSkeleton";
import { EventsPagination } from "@/components/events/EventsPagination";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { PublicPageHero } from "@/components/shared/PublicPageHero";
import { getStaticI18n } from "@/lib/i18n/server";

/** Debe ser literal: Next.js no analiza imports en segment config. */
export const revalidate = 120;

interface EventsPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
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
  const { events, total, limit } = await EventService.getPublicEvents({
    category: searchParams.category as never,
    search: searchParams.search,
    page,
    limit: 12,
  });

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 text-6xl opacity-20">✦</div>
        <h3 className="font-display text-2xl font-semibold text-foreground">{t("public.events.noEventsFound")}</h3>
        <p className="mt-2 text-muted-foreground">
          {t("public.events.adjustFilters")}
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="mb-6 text-sm text-muted-foreground">
        {t("public.events.showingEvents", { count: events.length, total })}
      </p>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
      />
    </>
  );
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const { t } = await getStaticI18n();
  const params = await searchParams;
  const [categories, { total: eventsTotal }] = await Promise.all([
    EventService.getCategories(null),
    EventService.getPublicEvents({ page: 1, limit: 1 }),
  ]);
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
          <aside className="w-full shrink-0 lg:w-64">
            <EventFilters currentFilters={params} categories={categories} />
          </aside>

          <main className="flex-1">
            <Suspense
              fallback={
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
