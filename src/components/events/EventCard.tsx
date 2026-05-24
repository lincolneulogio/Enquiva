import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Calendar, Lock, MapPin, Users } from "lucide-react";
import type { Event } from "@/lib/db/schema";
import {
  categoryColor,
  categoryLabel,
  formatEventDateShort,
  truncate,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/core";
import { db } from "@/lib/db";
import { registrations } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface EventCardProps {
  event: Event & { attendeeCount?: number };
  className?: string;
  categoryMap?: Record<string, { label: string; colorClass?: string | null }>;
}

export async function EventCard({
  event,
  className,
  categoryMap,
}: EventCardProps) {
  const locale = await getLocale();
  const t = (key: string, params?: Record<string, string | number>) =>
    translate(locale, key, params);
  const isVirtual = event.isVirtual;
  const isFull =
    event.capacity != null && (event.attendeeCount ?? 0) >= event.capacity;
  const isEventExpired = new Date(event.date).getTime() <= Date.now();
  const categoryMeta = categoryMap?.[event.category];

  const session = await auth.api.getSession({ headers: await headers() });
  let isUserRegistered = false;
  if (session?.user) {
    const [reg] = await db
      .select({ id: registrations.id })
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, event.id),
          eq(registrations.userId, session.user.id),
          ne(registrations.status, "cancelled"),
        ),
      )
      .limit(1);
    isUserRegistered = !!reg;
  }

  const cardContent = (
    <article
      data-aos="fade-up"
      data-aos-duration="650"
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/60 shadow-sm backdrop-blur-sm",
        isEventExpired
          ? "cursor-not-allowed border-destructive/25 bg-muted/40"
          : "fe-glow-hover hover:border-primary/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.3)]",
        className,
      )}
    >
      {/* Cover Image */}
      <div className="relative w-full overflow-hidden bg-secondary/15 flex items-center justify-center border-b border-border/50">
        {event.coverImage ? (
          <>
            {/* Ambient blurred background glow */}
            <div className="absolute inset-0 select-none overflow-hidden opacity-25 blur-[40px] dark:opacity-15 pointer-events-none">
              <Image
                src={event.coverImage}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            {/* Main fully visible image */}
            <div className="relative w-full overflow-hidden flex items-center justify-center p-0.5">
              <Image
                src={event.coverImage}
                alt={event.title}
                width={600}
                height={400}
                className={cn(
                  "w-full h-auto max-h-[220px] object-contain transition-all duration-700 ease-out z-10",
                  isEventExpired ? "grayscale-[0.35]" : "group-hover:scale-[1.02]",
                )}
              />
            </div>
          </>
        ) : (
          <div className="relative flex h-48 w-full items-center justify-center bg-gradient-to-br from-secondary via-secondary to-muted/80">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,hsl(var(--primary)/0.2),transparent_40%),radial-gradient(circle_at_80%_70%,hsl(var(--accent)/0.18),transparent_45%)]" />
            <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.04),transparent_60%)]" />
            <span className="relative text-5xl opacity-30">✦</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/25 to-transparent z-20" />

        {/* Category badge */}
        <div className="absolute left-3 top-3">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium shadow-sm",
              categoryMeta?.colorClass || categoryColor(event.category),
            )}
          >
            {categoryLabel(event.category, locale)}
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

        {/* Registered badge */}
        {isUserRegistered && (
          <div
            className={cn(
              "absolute right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-emerald-950 bg-emerald-100 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 shadow-md backdrop-blur-sm",
              event.isFeatured ? "top-12" : "top-3",
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Inscrito
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
        <h3
          className={cn(
            "mb-1.5 line-clamp-2 font-display text-[1.9rem] font-semibold leading-tight text-foreground transition-colors",
            !isEventExpired && "group-hover:text-primary",
          )}
        >
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
            <span className="font-medium text-foreground/90">
              {formatEventDateShort(event.date, locale)}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-1.5">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-lg bg-primary/10">
              <MapPin className="h-3.5 w-3.5 text-primary" />
            </span>
            <span className="line-clamp-1">
              {isVirtual
                ? t("common.virtualEvent")
                : (event.location ?? t("common.locationTbd"))}
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
                {isFull && (
                  <span className="ml-1 font-medium text-destructive">
                    ({t("common.full")})
                  </span>
                )}
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
            <div
              className={cn(
                "inline-flex w-full items-center justify-between rounded-xl border px-3.5 py-2 text-sm transition-all duration-300 shadow-sm",
                isUserRegistered
                  ? "border-emerald-500/20 bg-emerald-500/5 group-hover:bg-emerald-500/10"
                  : "border-primary/20 bg-gradient-to-r from-primary/[0.10] to-primary/[0.06] group-hover:from-primary/[0.14] group-hover:to-primary/[0.08]",
              )}
            >
              <span
                className={cn(
                  "font-medium flex items-center gap-1.5",
                  isUserRegistered
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-primary",
                )}
              >
                {isUserRegistered ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Ver mi Inscripción
                  </>
                ) : (
                  t("common.view")
                )}
              </span>
              <ArrowUpRight
                className={cn(
                  "h-4 w-4 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                  isUserRegistered ? "text-emerald-500" : "text-primary",
                )}
              />
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
