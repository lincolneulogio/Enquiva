"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Calendar, Flame, Sparkles, Star, X, Zap, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EventSpotlightData } from "@/services/events/event-spotlight.service";

export const BANNER_OFFSET_VAR = "--enquiva-banner-offset";

function setBannerOffset(px: number) {
  const value = `${Math.max(0, px)}px`;
  document.documentElement.style.setProperty(BANNER_OFFSET_VAR, value);
  document.body.style.paddingTop = value;
}

function clearBannerOffset() {
  document.documentElement.style.setProperty(BANNER_OFFSET_VAR, "0px");
  document.body.style.paddingTop = "";
}

function dismissKey(eventId: string) {
  return `enquiva-spotlight-dismissed:${eventId}`;
}

const badgeVariants = {
  fire: {
    badge: "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-800 dark:text-amber-200 border-amber-500/30",
    dot: "bg-orange-600 dark:bg-orange-400 shadow-orange-500/50",
    icon: Flame,
    cta: "bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-gray-950 shadow-amber-500/20",
  },
  bolt: {
    badge: "bg-gradient-to-r from-rose-500/20 to-amber-500/20 text-rose-800 dark:text-rose-200 border-rose-500/30",
    dot: "bg-rose-600 dark:bg-rose-400 shadow-rose-500/50 animate-pulse",
    icon: Zap,
    cta: "bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400 text-white dark:text-gray-950 shadow-rose-500/20",
  },
  clock: {
    badge: "bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-sky-800 dark:text-sky-200 border-sky-500/30",
    dot: "bg-sky-600 dark:bg-sky-400 shadow-sky-500/50",
    icon: Clock,
    cta: "bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-gray-950 shadow-sky-500/20",
  },
  star: {
    badge: "bg-gradient-to-r from-amber-500/25 to-yellow-500/25 text-amber-900 dark:text-yellow-200 border-yellow-500/40",
    dot: "bg-amber-600 dark:bg-yellow-400 shadow-yellow-500/50",
    icon: Star,
    cta: "bg-gradient-to-r from-amber-600 to-yellow-600 hover:opacity-95 text-white dark:text-gray-950 shadow-yellow-500/25",
  },
};

export function EventSpotlightBanner({
  event,
  isPreview = false,
}: {
  event: EventSpotlightData | null;
  isPreview?: boolean;
}) {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const barRef = useRef<HTMLElement>(null);

  const shouldShow =
    event &&
    (isPreview ||
      (pathname !== "/maintenance" &&
        !pathname.startsWith("/events/" + event.slug) &&
        !dismissed));

  useEffect(() => {
    if (isPreview || !event) return;
    try {
      const isDismissed = sessionStorage.getItem(dismissKey(event.id)) === "1";
      setDismissed(isDismissed);
    } catch {
      setDismissed(false);
    }
  }, [event, isPreview]);

  useEffect(() => {
    if (isPreview) return; // No alterar padding global si es solo preview en admin

    if (!shouldShow) {
      clearBannerOffset();
      return;
    }

    const el = barRef.current;
    if (!el) return;

    const sync = () => setBannerOffset(el.getBoundingClientRect().height);

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    window.addEventListener("resize", sync);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
      clearBannerOffset();
    };
  }, [shouldShow, isPreview]);

  if (!shouldShow || !event) return null;

  const variant = badgeVariants[event.badge.variant] || badgeVariants.star;
  const BadgeIcon = variant.icon;

  const content = (
    <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:gap-4 sm:px-6 lg:px-8">
      {/* Lado izquierdo / Central: Badge + Titulo + Mensaje */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {/* Badge Dinámico */}
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase shadow-sm",
            variant.badge,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", variant.dot)} />
          <BadgeIcon className="h-3 w-3" />
          <span>{event.badge.label.replace(/^[\p{Emoji}\s]+/u, "").trim() || event.badge.label}</span>
        </span>

        {/* Separador sutil en desktop */}
        <span className="hidden h-3.5 w-px bg-border/80 sm:inline-block" />

        {/* Título (solo texto informativo) y Snippet */}
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          <span
            className="truncate text-xs sm:text-sm font-semibold text-foreground select-text"
            title={event.title}
          >
            {event.title}
          </span>

          {event.highlightMessage && (
            <span className="hidden md:inline-flex items-center text-xs font-medium text-muted-foreground truncate">
              — {event.highlightMessage}
            </span>
          )}
        </div>
      </div>

      {/* Lado derecho: Botón CTA + Cerrar */}
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/events/${event.slug}`}
          className={cn(
            "group inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 active:scale-95 shadow-sm",
            variant.cta,
          )}
        >
          <span>Ver evento</span>
          <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>

        {!isPreview && (
          <button
            type="button"
            aria-label="Cerrar anuncio de evento"
            onClick={() => {
              try {
                sessionStorage.setItem(dismissKey(event.id), "1");
              } catch {}
              setDismissed(true);
            }}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  if (isPreview) {
    return (
      <div
        className="w-full overflow-hidden rounded-xl border border-border/80 bg-background/95 backdrop-blur-md shadow-sm"
      >
        {content}
      </div>
    );
  }

  return (
    <header
      ref={barRef}
      role="banner"
      aria-label="Evento destacado"
      className="fixed inset-x-0 top-0 z-[45] w-full overflow-hidden border-b border-border/60 bg-background/90 backdrop-blur-md shadow-sm supports-[backdrop-filter]:bg-background/80"
    >
      {/* Acento superior sutil */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
      {content}
    </header>
  );
}
