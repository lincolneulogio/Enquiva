import { Suspense } from "react";
import { getPublicEvents } from "@/actions/events";
import { EventCard } from "@/components/events/EventCard";
import { EventFilters } from "@/components/events/EventFilters";
import { EventCardSkeleton } from "@/components/events/EventCardSkeleton";
import { Search } from "lucide-react";

interface EventsPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    page?: string;
  }>;
}

async function EventsGrid({ searchParams }: { searchParams: Awaited<EventsPageProps["searchParams"]> }) {
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
        <h3 className="font-display text-2xl font-semibold text-foreground">No events found</h3>
        <p className="mt-2 text-muted-foreground">
          Try adjusting your filters or check back later.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="mb-6 text-sm text-muted-foreground">
        Showing {events.length} of {total} events
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </>
  );
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-display text-4xl font-semibold text-foreground sm:text-5xl">
            Community Events
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Discover meaningful events happening in your faith community
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar filters */}
          <aside className="w-full shrink-0 lg:w-60">
            <EventFilters currentFilters={params} />
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
              <EventsGrid searchParams={params} />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
