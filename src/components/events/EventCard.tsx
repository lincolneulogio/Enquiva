import Link from "next/link";
import {
  ArrowRight,
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
  QrCode,
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

        {/* Category badge bottom-left (inferior izquierdo) */}
        <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1.5 max-w-[58%]">
          <span className="inline-flex items-center gap-1.5 truncate rounded-full border border-white/20 bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs backdrop-blur-md">
            <CategoryIcon slug={event.category} className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">{categoryMeta?.label || categoryLabel(event.category, locale)}</span>
          </span>
        </div>

        {/* Modality badge bottom-right (inferior derecho) */}
        <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs backdrop-blur-md">
            {isVirtual ? (
              <>
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span>Online</span>
              </>
            ) : (event as { modality?: string }).modality === "hybrid" ? (
              <>
                <span className="h-2 w-2 rounded-full bg-purple-400" />
                <span>Híbrido</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>Presencial</span>
              </>
            )}
          </span>
        </div>

        {isEventExpired && (
          <div className="absolute inset-0 flex items-end p-3 z-30 bg-black/40 backdrop-blur-[1px]">
            <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/90 px-2.5 py-1 text-xs font-semibold text-destructive-foreground shadow-sm">
              <Lock className="h-3.5 w-3.5" />
              {t("register.registrationClosed")}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Fila superior: Estado de inscripción a la izquierda + Precio destacado a la derecha */}
        <div className="mb-2.5 flex items-center justify-between gap-2">
          {hasRegistration ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <BadgeCheck className="h-3 w-3" />
              <span>Te has registrado</span>
            </span>
          ) : !isEventExpired && !((event.attendeeCount ?? 0) >= (event.capacity ?? 100)) ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Inscripciones abiertas</span>
            </span>
          ) : (event.attendeeCount ?? 0) >= (event.capacity ?? 100) ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-0.5 text-[11px] font-bold text-destructive">
              <span>Cupos agotados</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              <span>Finalizado</span>
            </span>
          )}

          {/* Precio destacado en tamaño más grande */}
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

        {/* Meta Box idéntica a la captura */}
        <div className="mt-4 space-y-2 rounded-2xl border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground dark:bg-muted/15">
          {/* Fila 1: Fecha y Hora */}
          <div className="flex items-center justify-between font-medium">
            <span className="flex items-center gap-1.5 text-foreground/90">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{formatEventDateShort(event.date, locale)}</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock3 className="h-3 w-3 text-muted-foreground" />
              <span>
                {new Date(event.date).toLocaleTimeString(locale === "en" ? "en-US" : "es-PE", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            </span>
          </div>

          {/* Fila 2: Ubicación */}
          <div className="flex items-center gap-1.5 text-foreground/80 truncate">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">
              {isVirtual ? "Auditorio Principal & Zoom Live" : (event.location ?? "Ubicación por confirmar")}
            </span>
          </div>

          {/* Fila 3: Inscritos y Barra de Progreso */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 font-semibold text-foreground/80">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span>
                  {event.attendeeCount ?? 0} / {event.capacity ?? 100} inscritos
                </span>
              </span>
              <span className={cn(
                "font-semibold",
                (event.attendeeCount ?? 0) >= (event.capacity ?? 100)
                  ? "text-destructive"
                  : (event.capacity && (event.capacity - (event.attendeeCount ?? 0)) <= 10)
                    ? "text-primary font-bold"
                    : "text-primary/90"
              )}>
                {(event.attendeeCount ?? 0) >= (event.capacity ?? 100)
                  ? "Agotado"
                  : (event.capacity && (event.capacity - (event.attendeeCount ?? 0)) <= 10)
                    ? "Últimos cupos"
                    : "Cupos libres"}
              </span>
            </div>

            {/* Barra de progreso de cupos */}
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-primary/15 dark:bg-primary/20">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  (event.attendeeCount ?? 0) >= (event.capacity ?? 100)
                    ? "bg-destructive"
                    : "bg-primary shadow-2xs shadow-primary/30"
                )}
                style={{
                  width: `${Math.min(100, Math.max(6, Math.round(((event.attendeeCount ?? 0) / (event.capacity ?? 100)) * 100)))}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Botón de acción al pie de la tarjeta */}
        <div className="mt-4 pt-1">
          {hasRegistration ? (
            <div className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-2.5 text-center text-xs font-bold text-primary-foreground shadow-xs shadow-primary/25 transition-all hover:bg-primary/90">
              <QrCode className="h-4 w-4" />
              <span>VER MI PASE CON QR</span>
            </div>
          ) : !isEventExpired ? (
            <div className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-primary/30 bg-primary/10 py-2.5 text-center text-xs font-bold text-primary shadow-2xs transition-all duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/25">
              <span>VER DETALLES</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          ) : (
            <div className="flex w-full items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 py-2.5 text-center text-xs font-bold text-destructive">
              {t("register.eventExpired")}
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
