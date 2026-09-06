import { Calendar, Clock3, MapPin, Users } from "lucide-react";
import { formatEventDateShort, cn } from "@/lib/utils";
import type { Event } from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/core";

interface EventCardMetaBoxProps {
  event: Event & { attendeeCount?: number };
  locale: Locale;
  isVirtual: boolean;
}

export function EventCardMetaBox({ event, locale, isVirtual }: EventCardMetaBoxProps) {
  const attendeeCount = event.attendeeCount ?? 0;
  const capacity = event.capacity ?? 100;
  const isFull = attendeeCount >= capacity;
  const isAlmostFull = Boolean(event.capacity && capacity - attendeeCount <= 10);
  const fillPercentage = Math.min(100, Math.max(6, Math.round((attendeeCount / capacity) * 100)));

  return (
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
              {attendeeCount} / {capacity} inscritos
            </span>
          </span>
          <span
            className={cn(
              "font-semibold",
              isFull
                ? "text-destructive"
                : isAlmostFull
                  ? "text-primary font-bold"
                  : "text-primary/90"
            )}
          >
            {isFull ? "Agotado" : isAlmostFull ? "Últimos cupos" : "Cupos libres"}
          </span>
        </div>

        {/* Barra de progreso de cupos */}
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-primary/15 dark:bg-primary/20">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isFull ? "bg-destructive" : "bg-primary shadow-2xs shadow-primary/30"
            )}
            style={{ width: `${fillPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
