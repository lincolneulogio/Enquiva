import { Suspense } from "react";
import { getCategories, getPublicEvents } from "@/actions/events";
import { EventCard } from "@/components/events/EventCard";
import { EventFilters } from "@/components/events/EventFilters";
import { EventCardSkeleton } from "@/components/events/EventCardSkeleton";
import { EventsPagination } from "@/components/events/EventsPagination";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { getI18n } from "@/lib/i18n/server";

interface EventsPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    page?: string;
  }>;
}

interface CategoryOption {
  slug: string;
  label: string;
  colorClass?: string;
}

async function EventsGrid({
  searchParams,
  categoryMap,
}: {
  searchParams: Awaited<EventsPageProps["searchParams"]>;
  categoryMap: Record<string, { label: string; colorClass?: string | null }>;
}) {
  const { t } = await getI18n();
  const page = parseInt(searchParams.page ?? "1");
  const { events, total, limit } = await getPublicEvents({
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
          <EventCard key={event.id} event={event} categoryMap={categoryMap} />
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
  const { t } = await getI18n();
  const params = await searchParams;
  const categories = await getCategories();
  const categoryMap = Object.fromEntries(
    categories.map((category) => [
      category.slug,
      { label: category.label, colorClass: category.colorClass },
    ])
  );

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
            {t("public.events.title")}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("public.events.subtitle")}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-0">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar filters */}
          <aside className="w-full shrink-0 lg:w-60">
            <EventFilters currentFilters={params} categories={categories} />
          </aside>

          {/* Main content */}
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
