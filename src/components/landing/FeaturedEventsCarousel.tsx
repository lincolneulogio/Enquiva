import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { EventCard } from "@/components/events/EventCard";
import type { Event } from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/core";

interface FeaturedEventsCarouselProps {
  events: (Event & { attendeeCount?: number })[];
  t: (key: string) => string;
  locale?: Locale;
}

export function FeaturedEventsCarousel({ events, t, locale }: FeaturedEventsCarouselProps) {
  if (events.length === 0) return null;

  return (
    <section className="px-4 py-10 sm:px-6" data-aos="fade-up">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Star className="h-3.5 w-3.5 fill-primary" />
              {t("public.home.featuredBadge")}
            </p>
            <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
              {t("public.home.featuredTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              {t("public.home.featuredSubtitle")}
            </p>
          </div>
          <Link
            href="/events"
            className="hidden shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-primary transition-colors hover:bg-secondary sm:flex"
          >
            {t("public.home.viewAll")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:thin]">
          {events.map((event, index) => (
            <div
              key={event.id}
              className="w-[min(88vw,340px)] shrink-0 snap-start sm:w-[360px]"
              data-aos="fade-left"
              data-aos-delay={String(50 + index * 40)}
            >
              <EventCard event={event} priority={index === 0} hideDateMeta locale={locale} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
