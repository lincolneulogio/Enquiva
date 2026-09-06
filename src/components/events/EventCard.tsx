import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import type { Event } from "@/lib/db/schema";
import { truncate, cn } from "@/lib/utils";
import { defaultLocale, translate, type Locale } from "@/lib/i18n/core";
import type { ViewerEventStatus } from "@/lib/events/viewer-event-status";
import {
  EventCardCover,
  EventCardMetaBox,
  EventCardActionFooter,
} from "./card";

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
  viewerStatus,
  locale = defaultLocale,
}: EventCardProps) {
  const t = (key: string, params?: Record<string, string | number>) =>
    translate(locale, key, params);
  const isVirtual = event.isVirtual;
  const attendeeCount = event.attendeeCount ?? 0;
  const capacity = event.capacity ?? 100;
  const isFull = capacity != null && attendeeCount >= capacity;
  const isEventExpired = new Date(event.date).getTime() <= Date.now();
  const categoryMeta = categoryMap?.[event.category];

  const hasRegistration =
    viewerStatus != null &&
    viewerStatus !== "guest" &&
    viewerStatus !== "not_registered";

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
      <EventCardCover
        event={event}
        priority={priority}
        isEventExpired={isEventExpired}
        isVirtual={isVirtual}
        categoryLabelText={categoryMeta?.label}
        locale={locale}
        registrationClosedText={t("register.registrationClosed")}
      />

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Fila superior: Estado de inscripción a la izquierda + Precio destacado a la derecha */}
        <div className="mb-2.5 flex items-center justify-between gap-2">
          {hasRegistration ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <BadgeCheck className="h-3 w-3" />
              <span>Te has registrado</span>
            </span>
          ) : !isEventExpired && !isFull ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Inscripciones abiertas</span>
            </span>
          ) : isFull ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-0.5 text-[11px] font-bold text-destructive">
              <span>Cupos agotados</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              <span>Finalizado</span>
            </span>
          )}

          {/* Precio destacado */}
          <div className="shrink-0 text-right">
            {event.price != null && Number(event.price) > 0 ? (
              <span className="text-base sm:text-lg font-black tracking-tight text-primary">
                S/ {Number(event.price).toFixed(2)}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-black text-primary">
                Gratis
              </span>
            )}
          </div>
        </div>

        <h3
          className={cn(
            "line-clamp-2 font-display text-base sm:text-lg font-extrabold leading-snug text-foreground transition-colors group-hover:text-primary",
            isEventExpired && "text-muted-foreground",
          )}
        >
          {event.title}
        </h3>

        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {truncate(event.description, 130)}
        </p>

        <EventCardMetaBox event={event} locale={locale} isVirtual={isVirtual} />

        <EventCardActionFooter
          hasRegistration={hasRegistration}
          isEventExpired={isEventExpired}
          expiredText={t("register.eventExpired")}
        />
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
