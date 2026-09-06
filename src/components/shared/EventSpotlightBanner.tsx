"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Calendar, Clock, Flame, Sparkles, Star, X, Zap } from "lucide-react";
import type { EventSpotlightData } from "@/services/events/event-spotlight.service";
import { useLocale } from "@/components/providers/LocaleProvider";

export const BANNER_OFFSET_VAR = "--enquiva-banner-offset";

function setBannerOffset(px: number) {
  if (typeof document === "undefined") return;
  const value = `${Math.max(0, px)}px`;
  document.documentElement.style.setProperty(BANNER_OFFSET_VAR, value);
  document.body.style.paddingTop = value;
}

function clearBannerOffset() {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty(BANNER_OFFSET_VAR, "0px");
  document.body.style.paddingTop = "";
}

function dismissKey(eventId: string) {
  return `enquiva-spotlight-dismissed:${eventId}`;
}

export function isAuthPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const clean = pathname.split("?")[0].replace(/\/$/, "") || "/";
  if (
    clean === "/login" ||
    clean === "/register" ||
    clean === "/forgot-password" ||
    clean === "/two-factor" ||
    clean === "/superadmin/login" ||
    clean === "/superadmin/register"
  ) {
    return true;
  }
  if (clean.startsWith("/reset-password")) return true;
  if (clean.startsWith("/verify-account")) return true;
  return false;
}

function getBadgeIcon(variant?: string, type?: string) {
  if (variant === "fire" || type === "popular") return Flame;
  if (variant === "bolt") return Zap;
  if (variant === "clock" || type === "upcoming") return Clock;
  if (variant === "star" || type === "pinned") return Star;
  return Sparkles;
}

export function EventSpotlightBanner({
  event,
  isPreview = false,
}: {
  event: EventSpotlightData | null;
  isPreview?: boolean;
}) {
  const { locale } = useLocale();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const barRef = useRef<HTMLElement>(null);

  const isCurrentEventPage = Boolean(
    event && pathname.startsWith(`/events/${event.slug}`),
  );

  const isAuthPage = isAuthPath(pathname);

  const shouldShow =
    event &&
    (isPreview ||
      (pathname !== "/maintenance" && !isAuthPage && !isCurrentEventPage && !dismissed));

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
    if (isPreview) return;

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

  const BadgeIcon = getBadgeIcon(event.badge?.variant, event.badge?.type);
  const cleanBadgeLabel =
    event.badge?.label?.replace(/^[\p{Emoji}\s]+/u, "").trim() || "COMIENZA PRONTO";

  let dateFormatted = "";
  let timeFormatted = "";

  if (event.date) {
    try {
      const dateLocale = locale.startsWith("en") ? "en-US" : "es-PE";
      const dateObj = new Date(event.date);
      dateFormatted = dateObj.toLocaleDateString(dateLocale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      timeFormatted = dateObj.toLocaleTimeString(dateLocale, {
        hour: "2-digit",
        minute: "2-digit",
      });
      if (event.endDate) {
        const endObj = new Date(event.endDate);
        const endTimeFormatted = endObj.toLocaleTimeString(dateLocale, {
          hour: "2-digit",
          minute: "2-digit",
        });
        timeFormatted = `${timeFormatted} - ${endTimeFormatted}`;
      }
    } catch {
      dateFormatted = "";
      timeFormatted = "";
    }
  }

  const content = (
    <div className="relative mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs sm:text-sm text-white">
      {/* Lado izquierdo / Central: Badge + Titulo + Fecha + Hora */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 font-medium">
        {/* Badge Dinámico en píldora con fondo oscuro translúcido */}
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-white backdrop-blur-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <BadgeIcon className="h-3 w-3" />
          <span className="uppercase">{cleanBadgeLabel}</span>
        </span>

        {/* Título del evento */}
        <span
          className="truncate max-w-full font-bold text-white select-text"
          title={event.title}
        >
          {event.title}
        </span>

        {dateFormatted && (
          <>
            <span className="hidden opacity-60 sm:inline">•</span>
            <span className="flex shrink-0 items-center gap-1 text-white/95">
              <Calendar className="h-3.5 w-3.5" />
              {dateFormatted}
            </span>
          </>
        )}

        {timeFormatted && (
          <>
            <span className="hidden opacity-60 sm:inline">•</span>
            <span className="flex shrink-0 items-center gap-1 text-white/95">
              <Clock className="h-3.5 w-3.5" />
              {timeFormatted}
            </span>
          </>
        )}
      </div>

      {/* Lado derecho: Botón Reservar cupo + Cerrar */}
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/events/${event.slug}#registro`}
          onClick={(e) => {
            if (isCurrentEventPage && typeof window !== "undefined") {
              const el = document.getElementById("registro");
              if (el) {
                e.preventDefault();
                el.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-bold text-primary shadow-xs transition-all hover:bg-white/90 hover:shadow-md cursor-pointer"
        >
          <span>{locale === "en" ? "Book now" : "Reservar cupo"}</span>
          <ArrowRight className="h-3 w-3" />
        </Link>

        {!isPreview && (
          <button
            type="button"
            aria-label={locale === "en" ? "Dismiss event announcement" : "Cerrar anuncio de evento"}
            onClick={() => {
              try {
                sessionStorage.setItem(dismissKey(event.id), "1");
              } catch {}
              setDismissed(true);
            }}
            className="rounded-full p-1 text-white/80 hover:bg-black/20 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  if (isPreview) {
    return (
      <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-xs">
        {content}
      </div>
    );
  }

  return (
    <header
      ref={barRef}
      role="banner"
      aria-label="Evento destacado"
      className="fixed inset-x-0 top-0 z-[45] w-full min-w-0 max-w-full overflow-hidden bg-primary text-primary-foreground shadow-xs"
    >
      {content}
    </header>
  );
}
