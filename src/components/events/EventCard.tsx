import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Calendar, Lock, MapPin, Users } from "lucide-react";
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
  const isEventExpired = new Date(event.date).getTime() <= Date.now();
  const categoryMeta = categoryMap?.[event.category];

  const cardContent = (
    <article
      data-aos="fade-up"
      data-aos-duration="650"
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card/95 shadow-sm transition-all duration-300",
        isEventExpired
          ? "cursor-not-allowed border-destructive/25 bg-muted/40"
          : "hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl",
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
            className={cn(
              "object-cover transition-transform duration-500",
              isEventExpired ? "grayscale-[0.35]" : "group-hover:scale-105"
            )}
          />
        ) : (
          <div className="relative flex h-full items-center justify-center bg-gradient-to-br from-secondary to-muted/80">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,hsl(var(--primary)/0.16),transparent_40%),radial-gradient(circle_at_80%_70%,hsl(var(--accent)/0.14),transparent_45%)]" />
            <span className="relative text-5xl opacity-30">✦</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Category badge */}
        <div className="absolute left-3 top-3">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium shadow-sm",
              categoryMeta?.colorClass || categoryColor(event.category)
            )}
          >
            {categoryMeta?.label || categoryLabel(event.category, locale)}
          </span>
        </div>

        {/* Featured badge */}
        {event.isFeatured && (
          <div className="absolute right-3 top-3">
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground shadow-sm">
              {t("common.featured")}
            </span>
          </div>
        )}

        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/35 bg-black/35 px-2.5 py-1 text-xs font-medium text-white/95 backdrop-blur-sm">
            <Calendar className="h-3 w-3" />
            {formatEventDateShort(event.date, locale)}
          </span>
        </div>

        {isEventExpired && (
          <div className="absolute inset-0 flex items-end p-3">
            <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/85 px-2.5 py-1 text-xs font-medium text-destructive-foreground shadow-sm">
              <Lock className="h-3.5 w-3.5" />
              {t("register.registrationClosed")}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className={cn(
          "mb-1.5 line-clamp-2 font-display text-[1.9rem] font-semibold leading-tight text-foreground transition-colors",
          !isEventExpired && "group-hover:text-primary"
        )}>
          {event.title}
        </h3>

        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {truncate(event.description, 120)}
        </p>

        {/* Meta */}
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-1.5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-3.5 w-3.5 text-primary" />
            </span>
            <span className="font-medium text-foreground/90">{formatEventDateShort(event.date, locale)}</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-1.5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-lg bg-primary/10">
              <MapPin className="h-3.5 w-3.5 text-primary" />
            </span>
            <span className="line-clamp-1">
              {isVirtual ? t("common.virtualEvent") : (event.location ?? t("common.locationTbd"))}
            </span>
          </div>

          {event.capacity != null && (
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-3.5 w-3.5 text-primary" />
              </span>
              <span className="line-clamp-1">
                {t("common.registeredCount", {
                  count: event.attendeeCount ?? 0,
                  capacity: event.capacity,
                })}
                {isFull && <span className="ml-1 font-medium text-destructive">({t("common.full")})</span>}
              </span>
            </div>
          )}

          {event.capacity == null && (
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-3.5 w-3.5 text-primary" />
              </span>
              <span className="line-clamp-1">
                {isVirtual
                  ? `${t("public.eventDetail.capacityLabel")}: ${t("public.eventDetail.unlimited")}`
                  : t("common.registered")}
              </span>
            </div>
          )}
        </div>

        <div className="mt-3 border-t border-border/70 pt-3">
          {!isEventExpired ? (
            <div className="inline-flex w-full items-center justify-between rounded-xl border border-primary/20 bg-primary/[0.10] px-3.5 py-2 text-sm transition-colors group-hover:bg-primary/[0.12]">
              <span className="font-medium text-primary">{t("common.view")}</span>
              <ArrowUpRight className="h-4 w-4 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
          ) : (
            <div className="inline-flex w-full items-center justify-center rounded-xl border border-destructive/20 bg-destructive/[0.08] px-3.5 py-2 text-sm font-medium text-destructive/90">
              {t("register.eventExpired")}
            </div>
          )}

          {!isEventExpired && isFull && (
            <div className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2 text-sm font-medium text-amber-700 dark:text-amber-400">
              {t("register.eventFull")}
            </div>
          )}
        </div>
      </div>
    </article>
  );

  if (isEventExpired) {
    return (
      <div className="group block h-full" aria-disabled="true">
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
    >
      {cardContent}
    </Link>
  );
}
