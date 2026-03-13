import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Users } from "lucide-react";
import type { Event } from "@/lib/db/schema";
import { categoryColor, categoryLabel, formatEventDateShort, truncate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/core";

interface EventCardProps {
  event: Event & { attendeeCount?: number };
  className?: string;
  categoryMap?: Record<string, { label: string; colorClass?: string | null }>;
}

export async function EventCard({ event, className, categoryMap }: EventCardProps) {
  const locale = await getLocale();
  const t = (key: string, params?: Record<string, string | number>) => translate(locale, key, params);
  const isVirtual = event.isVirtual;
  const isFull = event.capacity != null && (event.attendeeCount ?? 0) >= event.capacity;
  const categoryMeta = categoryMap?.[event.category];

  return (
    <Link href={`/events/${event.slug}`}>
      <article
        className={cn(
          "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-lg",
          className
        )}
      >
        {/* Cover Image */}
        <div className="relative h-48 overflow-hidden bg-secondary">
          {event.coverImage ? (
            <Image
              src={event.coverImage}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-5xl opacity-20">✦</span>
            </div>
          )}
          {/* Category badge */}
          <div className="absolute left-3 top-3">
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", categoryMeta?.colorClass || categoryColor(event.category))}>
              {categoryMeta?.label || categoryLabel(event.category, locale)}
            </span>
          </div>
          {/* Featured badge */}
          {event.isFeatured && (
            <div className="absolute right-3 top-3">
              <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                {t("common.featured")}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="mb-2 font-display text-xl font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {truncate(event.description, 120)}
          </p>

          {/* Meta */}
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{formatEventDateShort(event.date, locale)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="truncate">
                {isVirtual ? t("common.virtualEvent") : (event.location ?? t("common.locationTbd"))}
              </span>
            </div>
            {event.capacity != null && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>
                  {t("common.registeredCount", {
                    count: event.attendeeCount ?? 0,
                    capacity: event.capacity,
                  })}
                  {isFull && <span className="ml-1 text-destructive font-medium">({t("common.full")})</span>}
                </span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
