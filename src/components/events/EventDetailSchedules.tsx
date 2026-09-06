"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarExportDropdown } from "./CalendarExportDropdown";

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
  eventDate?: Date | string;
  eventEndDate?: Date | string | null;
  isVirtual?: boolean;
  schedules?: EventScheduleOption[];
}

const DEFAULT_SCHEDULES: EventScheduleOption[] = [
  {
    id: "slot-main",
    label: "Horario Principal",
    timeRange: "09:00 a. m. - --",
    description: "Acceso a todas las actividades programadas",
    badgeText: "Seleccionado",
    badgeVariant: "selected",
  },
];

export function EventDetailSchedules({
  formattedDate,
  eventTitle,
  eventDescription,
  eventLocation,
  eventDate,
  eventEndDate,
  isVirtual = false,
  schedules = DEFAULT_SCHEDULES,
}: EventDetailSchedulesProps) {
  const [selectedId, setSelectedId] = useState<string>(schedules[0]?.id ?? "slot-morning");

  useEffect(() => {
    if (!schedules.some((s) => s.id === selectedId) && schedules.length > 0) {
      setSelectedId(schedules[0].id);
    }
  }, [schedules, selectedId]);

  const selectedSlot = schedules.find((s) => s.id === selectedId);
  const effectiveDate = selectedSlot?.date ?? eventDate ?? new Date();

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

        <CalendarExportDropdown
          eventTitle={selectedSlot?.label ? `${eventTitle} (${selectedSlot.label})` : eventTitle}
          eventDescription={eventDescription}
          eventLocation={eventLocation}
          eventDate={effectiveDate}
          eventEndDate={eventEndDate}
          isVirtual={isVirtual}
          buttonLabel="Añadir a mi calendario"
        />
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
                  ? "border-primary bg-white dark:bg-card shadow-xs ring-1 ring-primary/20"
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
                        ? "border-primary bg-white"
                        : "border-muted-foreground/40 bg-transparent"
                    )}
                  >
                    {isSelected && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </div>

                {/* Badge contextual idéntico a la imagen */}
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight",
                    isSelected
                      ? "bg-primary text-primary-foreground"
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
