import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EventCard } from "@/components/events/EventCard";
import type { Event } from "@/lib/db/schema";

interface EventsShowcaseProps {
  events: Array<Event & { attendeeCount?: number }>;
  t: (key: string) => string;
}

export function EventsShowcase({ events, t }: EventsShowcaseProps) {
  if (events.length === 0) return null;

  return (
    <section className="px-4 pb-20 pt-10 sm:px-6" data-aos="fade-up" data-aos-delay="80">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
              {t("public.home.upcomingTitle")}
            </h2>
            <p className="mt-1 text-muted-foreground">
              {t("public.home.upcomingSubtitle")}
            </p>
          </div>
          <Link
            href="/events"
            className="hidden items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-primary transition-colors hover:bg-secondary sm:flex"
          >
            {t("public.home.viewAll")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 sm:justify-items-stretch lg:grid-cols-3">
          {events.map((event, index) => (
            <div
              key={event.id}
              className="w-full max-w-md sm:max-w-none"
              data-aos="zoom-in-up"
              data-aos-delay={String(70 + index * 60)}
            >
              <EventCard event={event} priority={index === 0} hideDateMeta />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
