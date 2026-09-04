import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Calendar,
  Clock3,
  CreditCard,
  Lock,
  MapPin,
  UserRoundCheck,
  Users,
  XCircle,
  Video,
  Globe,
} from "lucide-react";
import { EventCoverFrame, EventCoverPlaceholder } from "@/components/events/EventCoverFrame";
import { LiveAttendeeCount } from "@/components/events/LiveAttendeeCount";
import type { Event } from "@/lib/db/schema";
import {
  categoryColor,
  categoryLabel,
  formatEventDateShort,
  truncate,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import { defaultLocale, translate, type Locale } from "@/lib/i18n/core";
import type { ViewerEventStatus } from "@/lib/events/viewer-event-status";
import { getCategoryDefinition } from "@/lib/events/taxonomy";
import { CategoryIcon } from "@/components/events/CategoryIcon";

interface EventCardProps {
  event: Event & { attendeeCount?: number };
  className?: string;
  categoryMap?: Record<string, { label: string; colorClass?: string | null }>;
  priority?: boolean;
  /** Oculta la fila de fecha en meta (ya aparece en la portada). */
  hideDateMeta?: boolean;
  viewerStatus?: ViewerEventStatus;
  /** Idioma del caller. Default de código: no leer cookies en el catálogo público. */
  locale?: Locale;
}

export function EventCard({
  event,
  className,
  categoryMap,
  priority = false,
  hideDateMeta = false,
  viewerStatus,
  locale = defaultLocale,
}: EventCardProps) {
  const t = (key: string, params?: Record<string, string | number>) =>
    translate(locale, key, params);
  const isVirtual = event.isVirtual;
  const isFull =
    event.capacity != null && (event.attendeeCount ?? 0) >= event.capacity;
  const isEventExpired = new Date(event.date).getTime() <= Date.now();
  const categoryMeta = categoryMap?.[event.category];

  const hasRegistration =
    viewerStatus != null &&
    viewerStatus !== "guest" &&
    viewerStatus !== "not_registered";
  const viewerStatusMeta = viewerStatus
    ? {
        guest: {
          label: t("public.events.viewerStatus.guest"),
          tone: "border-border bg-muted/90 text-muted-foreground",
          Icon: UserRoundCheck,
        },
        not_registered: {
          label: t("public.events.viewerStatus.notRegistered"),
          tone: "border-slate-300 bg-slate-100/90 text-slate-700 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300",
          Icon: UserRoundCheck,
        },
        registered: {
          label: t("public.events.viewerStatus.registered"),
          tone: "border-emerald-300 bg-emerald-100/90 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300",
          Icon: BadgeCheck,
        },
        reserved: {
          label: t("public.events.viewerStatus.reserved"),
          tone: "border-amber-300 bg-amber-100/90 text-amber-950 dark:border-amber-800 dark:bg-amber-950/90 dark:text-amber-300",
          Icon: Clock3,
        },
        reservation_expired: {
          label: t("public.events.viewerStatus.reservationExpired"),
          tone: "border-rose-300 bg-rose-100/90 text-rose-950 dark:border-rose-800 dark:bg-rose-950/90 dark:text-rose-300",
          Icon: XCircle,
        },
        paid: {
          label: t("public.events.viewerStatus.paid"),
          tone: "border-sky-300 bg-sky-100/90 text-sky-950 dark:border-sky-800 dark:bg-sky-950/90 dark:text-sky-300",
          Icon: CreditCard,
        },
        payment_rejected: {
          label: t("public.events.viewerStatus.paymentRejected"),
          tone: "border-rose-300 bg-rose-100/90 text-rose-950 dark:border-rose-800 dark:bg-rose-950/90 dark:text-rose-300",
          Icon: XCircle,
        },
        waitlisted: {
          label: t("public.events.viewerStatus.waitlisted"),
          tone: "border-violet-300 bg-violet-100/90 text-violet-950 dark:border-violet-800 dark:bg-violet-950/90 dark:text-violet-300",
          Icon: Clock3,
        },
        checked_in: {
          label: t("public.events.viewerStatus.checkedIn"),
          tone: "border-emerald-300 bg-emerald-100/90 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300",
          Icon: BadgeCheck,
        },
      }[viewerStatus]
    : null;
  const ViewerStatusIcon = viewerStatusMeta?.Icon;
  const viewerCta =
    viewerStatus === "paid" || viewerStatus === "checked_in"
      ? t("public.events.viewerStatus.viewTicket")
      : viewerStatus === "reserved"
        ? t("public.events.viewerStatus.completePayment")
        : viewerStatus === "reservation_expired" ||
            viewerStatus === "payment_rejected"
          ? t("public.events.viewerStatus.retryPayment")
          : viewerStatus === "waitlisted"
            ? t("public.events.viewerStatus.viewStatus")
            : viewerStatus === "registered"
              ? t("public.events.viewerStatus.viewRegistration")
              : t("common.view");
  const paymentNeedsAttention =
    viewerStatus === "reservation_expired" ||
    viewerStatus === "payment_rejected";

  const cardContent = (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-3xl border border-border/80 bg-background/60 backdrop-blur-md hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.5)] hover:border-primary/35",
        isEventExpired
          ? "cursor-not-allowed border-destructive/25 bg-muted/40"
          : "fe-glow-hover",
        className,
      )}
    >
      {/* Cover Image — marco fijo 16:10, imagen completa sin recorte (object-contain) */}
      <div className="relative w-full overflow-hidden border-b border-border/50">
        {event.coverImage ? (
          <EventCoverFrame
            src={event.coverImage}
            alt={event.title}
            variant="card"
            priority={priority}
            dimmed={isEventExpired}
            imageClassName={isEventExpired ? undefined : "group-hover:scale-[1.02]"}
          />
        ) : (
          <EventCoverPlaceholder />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-14 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Category & Modality badges */}
        <div className="absolute left-3 top-3 z-30 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm border border-white/10 backdrop-blur-md",
              categoryMeta?.colorClass || categoryColor(event.category),
            )}
          >
            <CategoryIcon slug={event.category} className="h-3.5 w-3.5 shrink-0" />
            <span>{categoryMeta?.label || categoryLabel(event.category, locale)}</span>
          </span>

          <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white shadow-xs backdrop-blur-md">
            {isVirtual ? (
              <>
                <Video className="h-3 w-3 text-cyan-400" />
                <span>Online</span>
              </>
            ) : (
              <>
                <MapPin className="h-3 w-3 text-emerald-400" />
                <span>Presencial</span>
              </>
            )}
          </span>
        </div>

        {/* Featured badge */}
        {event.isFeatured && (
          <div className="absolute right-3 top-3 z-30">
            <span className="rounded-full bg-accent/90 border border-white/15 px-2.5 py-1 text-xs font-semibold text-accent-foreground shadow-sm backdrop-blur-md">
              {t("common.featured")}
            </span>
          </div>
        )}

        {/* Estado personal del usuario; separado del estado público del evento. */}
        {hasRegistration && viewerStatusMeta && ViewerStatusIcon && (
          <div
            className={cn(
              "absolute right-3 z-30 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold shadow-md backdrop-blur-md",
              viewerStatusMeta.tone,
              event.isFeatured ? "top-12" : "top-3",
            )}
          >
            <ViewerStatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {viewerStatusMeta.label}
          </div>
        )}

        <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm backdrop-blur-md">
            <Calendar className="h-3 w-3" />
            {formatEventDateShort(event.date, locale)}
          </span>
          {event.schedules && event.schedules.length > 1 && (
            <span className="inline-flex items-center rounded-full border border-white/20 bg-black/55 px-2 py-0.5 text-[10px] font-bold text-amber-300 shadow-sm backdrop-blur-md">
              {event.schedules.length} turnos
            </span>
          )}
        </div>

        {/* Price badge */}
        <div className="absolute bottom-3 right-3 z-30">
          {event.price != null && Number(event.price) > 0 ? (
            <span className="inline-flex items-center rounded-full border border-white/20 bg-black/70 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs backdrop-blur-md">
              S/ {Number(event.price).toFixed(2)}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-950/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 shadow-xs backdrop-blur-md">
              Gratis
            </span>
          )}
        </div>

        {isEventExpired && (
          <div className="absolute inset-0 flex items-end p-3 z-30 bg-black/10 backdrop-blur-[1px]">
            <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/90 px-2.5 py-1 text-xs font-semibold text-destructive-foreground shadow-sm">
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
            "mb-2 line-clamp-2 font-display text-lg sm:text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-primary",
            isEventExpired && "text-muted-foreground",
          )}
        >
          {event.title}
        </h3>

        <p className="mb-4 line-clamp-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
          {truncate(event.description, 120)}
        </p>

        {/* Meta */}
        <div className="space-y-2 text-xs text-muted-foreground mt-auto">
          {!hideDateMeta && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-border/30 bg-secondary/5 dark:bg-secondary/5 px-3 py-2 transition-all hover:bg-secondary/15 hover:border-border/50">
              <span className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/10 shrink-0">
                <Calendar className="h-3.5 w-3.5 text-primary" />
              </span>
              <span className="font-semibold text-foreground/90 leading-none">
                {formatEventDateShort(event.date, locale)}
              </span>
            </div>
          )}

          {/* Location */}
          <div className="flex items-center gap-2.5 rounded-2xl border border-border/30 bg-secondary/5 dark:bg-secondary/5 px-3 py-2 transition-all hover:bg-secondary/15 hover:border-border/50">
            <span className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 shrink-0 border border-violet-500/10 dark:text-violet-400">
              <MapPin className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
            </span>
            <span className="font-semibold text-foreground/80 leading-none truncate flex-1">
              {isVirtual
                ? t("common.virtualEvent")
                : (event.location ?? t("common.locationTbd"))}
            </span>
          </div>

          {/* Capacity/Registered */}
          <div className="flex items-center gap-2.5 rounded-2xl border border-border/30 bg-secondary/5 dark:bg-secondary/5 px-3 py-2 transition-all hover:bg-secondary/15 hover:border-border/50">
            <span className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0 border border-emerald-500/10 dark:text-emerald-400">
              <Users className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
            </span>
            <span className="font-semibold text-foreground/80 leading-none truncate flex-1">
              <LiveAttendeeCount
                eventId={event.id}
                initialCount={event.attendeeCount ?? 0}
                capacity={event.capacity}
              />
            </span>
          </div>

          {viewerStatusMeta && ViewerStatusIcon && (
            <div
              className={cn(
                "flex items-center gap-2.5 rounded-2xl border px-3 py-2",
                viewerStatusMeta.tone,
              )}
            >
              <span className="inline-flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-xl bg-background/60">
                <ViewerStatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-wide opacity-70">
                  {t("public.events.viewerStatus.label")}
                </span>
                <span className="block truncate font-semibold leading-tight">
                  {viewerStatusMeta.label}
                </span>
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-border/50 pt-4">
          {!isEventExpired ? (
            <div
              className={cn(
                "inline-flex w-full items-center justify-between rounded-2xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm",
                paymentNeedsAttention
                  ? "border-rose-500/25 bg-rose-500/5 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600"
                  : viewerStatus === "reserved"
                    ? "border-amber-500/25 bg-amber-500/5 text-amber-700 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600"
                    : hasRegistration
                  ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 group-hover:shadow-md group-hover:shadow-emerald-500/10"
                  : "border-primary/25 bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20",
              )}
            >
              <span className="font-bold flex items-center gap-1.5">
                {hasRegistration ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse group-hover:bg-white transition-colors duration-300" />
                    {viewerCta}
                  </>
                ) : (
                  t("common.view")
                )}
              </span>
              <ArrowUpRight
                className="h-4 w-4 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </div>
          ) : (
            <div className="inline-flex w-full items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/[0.08] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-destructive/90">
              {t("register.eventExpired")}
            </div>
          )}

          {!isEventExpired && isFull && (
            <div className="mt-2 inline-flex w-full items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
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
