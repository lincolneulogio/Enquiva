"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";

export interface PromoEventData {
  id?: string;
  title: string;
  slug: string;
  date: Date | string;
  endDate?: Date | string | null;
  badgeLabel?: string;
  highlightMessage?: string;
}

interface TopPromoAnnouncementProps {
  event?: PromoEventData | null;
  eventSlug?: string;
}

export function TopPromoAnnouncement({
  event,
  eventSlug,
}: TopPromoAnnouncementProps) {
  const effectiveTitle =
    event?.title || "Congreso Regional de Emprendimiento e Innovación 2026";
  const effectiveSlug =
    event?.slug ||
    eventSlug ||
    "congreso-regional-de-emprendimiento-e-innovacin-2026-9yy1w";
  const effectiveBadge = event?.badgeLabel || "COMIENZA PRONTO";

  let dateFormatted = "24 oct. 2026";
  let timeFormatted = "09:21 a. m.";

  if (event?.date) {
    const dateObj = new Date(event.date);
    dateFormatted = dateObj.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    timeFormatted = dateObj.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    if (event.endDate) {
      const endObj = new Date(event.endDate);
      const endTimeFormatted = endObj.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      timeFormatted = `${timeFormatted} - ${endTimeFormatted}`;
    }
  }

  return (
    <aside
      aria-label="Anuncio destacado"
      className="w-full bg-[#FF5500] px-4 py-2 text-white shadow-xs"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 font-medium">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-white backdrop-blur-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            <Clock className="h-3 w-3" />
            {effectiveBadge}
          </span>
          <span className="truncate font-bold" title={effectiveTitle}>
            {effectiveTitle}
          </span>
          <span className="hidden opacity-60 sm:inline">•</span>
          <span className="flex shrink-0 items-center gap-1 opacity-95">
            <Calendar className="h-3.5 w-3.5" />
            {dateFormatted}
          </span>
          <span className="hidden opacity-60 sm:inline">•</span>
          <span className="flex shrink-0 items-center gap-1 opacity-95">
            <Clock className="h-3.5 w-3.5" />
            {timeFormatted}
          </span>
        </div>

        <Link
          href={`/events/${effectiveSlug}#registro`}
          onClick={(e) => {
            if (typeof window !== "undefined" && window.location.pathname.includes(effectiveSlug)) {
              const el = document.getElementById("registro");
              if (el) {
                e.preventDefault();
                el.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-bold text-[#FF5500] shadow-xs transition-all hover:bg-white/90 hover:shadow-md cursor-pointer"
        >
          <span>Reservar cupo</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </aside>
  );
}

