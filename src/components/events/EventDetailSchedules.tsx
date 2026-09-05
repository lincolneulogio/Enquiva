"use client";

import { useState } from "react";
import { Calendar, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EventScheduleOption {
  id: string;
  label: string;
  timeRange: string;
  description: string;
  badgeText: string;
  badgeVariant: "selected" | "available" | "vip";
  date?: string | Date;
}

interface EventDetailSchedulesProps {
  formattedDate: string;
  eventTitle: string;
  eventDescription?: string | null;
  eventLocation?: string | null;
  schedules?: EventScheduleOption[];
}

const DEFAULT_SCHEDULES: EventScheduleOption[] = [
  {
    id: "slot-morning",
    label: "Turno Mañana",
    timeRange: "09:00 AM - 12:30 PM",
    description: "Conferencias magistrales y apertura",
    badgeText: "Seleccionado",
    badgeVariant: "selected",
  },
  {
    id: "slot-afternoon",
    label: "Turno Tarde",
    timeRange: "02:30 PM - 06:00 PM",
    description: "Talleres prácticos en innovación",
    badgeText: "Cupos disponibles",
    badgeVariant: "available",
  },
  {
    id: "slot-night",
    label: "Turno Noche",
    timeRange: "06:30 PM - 09:30 PM",
    description: "Networking & Pitch de proyectos",
    badgeText: "Acceso VIP / Networking",
    badgeVariant: "vip",
  },
];

export function EventDetailSchedules({
  formattedDate,
  eventTitle,
  eventDescription,
  eventLocation,
  schedules = DEFAULT_SCHEDULES,
}: EventDetailSchedulesProps) {
  const [selectedId, setSelectedId] = useState<string>(schedules[0]?.id ?? "slot-morning");

  const handleAddToCalendar = () => {
    const text = encodeURIComponent(eventTitle);
    const details = encodeURIComponent(eventDescription || eventTitle);
    const location = encodeURIComponent(eventLocation || "Huánuco, Perú");
    // Google Calendar template URL
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&location=${location}`;
    window.open(gCalUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-[#FCFAF6] dark:bg-card/60 p-4 sm:p-5 space-y-4">
      {/* Cabecera de Fecha y Enlace a Calendario */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              FECHA Y HORARIOS DISPONIBLES
            </span>
            <span className="text-sm sm:text-base font-bold text-foreground">
              {formattedDate}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddToCalendar}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF5500] hover:text-[#E04B00] transition-colors cursor-pointer self-start sm:self-center"
        >
          <span>Añadir a mi calendario</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 3 Tarjetas de selección de turnos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {schedules.map((schedule) => {
          const isSelected = selectedId === schedule.id;

          return (
            <div
              key={schedule.id}
              onClick={() => setSelectedId(schedule.id)}
              className={cn(
                "relative rounded-xl border p-3 sm:p-3.5 transition-all cursor-pointer flex flex-col justify-between gap-2.5",
                isSelected
                  ? "border-[#FF5500] bg-white dark:bg-card shadow-xs ring-1 ring-[#FF5500]/20"
                  : "border-border/80 bg-white/70 hover:bg-white dark:bg-card/40 dark:hover:bg-card hover:border-border"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                {/* Radio button visual */}
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                      isSelected
                        ? "border-[#FF5500] bg-white"
                        : "border-muted-foreground/40 bg-transparent"
                    )}
                  >
                    {isSelected && (
                      <div className="h-2 w-2 rounded-full bg-[#FF5500]" />
                    )}
                  </div>
                </div>

                {/* Badge contextual idéntico a la imagen */}
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight",
                    isSelected
                      ? "bg-[#FF5500] text-white"
                      : schedule.badgeVariant === "available"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50"
                      : "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50"
                  )}
                >
                  {isSelected ? "Seleccionado" : schedule.badgeText}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-foreground leading-tight">
                  {schedule.label}: {schedule.timeRange}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  {schedule.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
