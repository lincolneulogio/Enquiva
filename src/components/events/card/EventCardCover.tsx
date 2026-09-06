import { Lock } from "lucide-react";
import { EventCoverFrame, EventCoverPlaceholder } from "@/components/events/EventCoverFrame";
import { CategoryIcon } from "@/components/events/CategoryIcon";
import { categoryLabel } from "@/lib/utils";
import type { Event } from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/core";

interface EventCardCoverProps {
  event: Event;
  priority?: boolean;
  isEventExpired: boolean;
  isVirtual: boolean;
  categoryLabelText?: string;
  locale: Locale;
  registrationClosedText: string;
}

export function EventCardCover({
  event,
  priority = false,
  isEventExpired,
  isVirtual,
  categoryLabelText,
  locale,
  registrationClosedText,
}: EventCardCoverProps) {
  return (
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

      {/* Category badge bottom-left */}
      <div className="absolute bottom-3 left-3 z-30 flex items-center gap-1.5 max-w-[58%]">
        <span className="inline-flex items-center gap-1.5 truncate rounded-full border border-white/20 bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs backdrop-blur-md">
          <CategoryIcon slug={event.category} className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate">{categoryLabelText || categoryLabel(event.category, locale)}</span>
        </span>
      </div>

      {/* Modality badge bottom-right */}
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
            {registrationClosedText}
          </span>
        </div>
      )}
    </div>
  );
}
