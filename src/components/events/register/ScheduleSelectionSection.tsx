"use client";

import React from "react";
import { Clock, Calendar, Check } from "lucide-react";
import { EventScheduleSlot } from "./types";

interface ScheduleSelectionSectionProps {
  schedules: EventScheduleSlot[];
  selectedScheduleId: string;
  onSelectSchedule: (scheduleId: string) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function formatSlotDateTime(dateStr: string, endDateStr?: string | null) {
  try {
    const date = new Date(dateStr);
    const formattedDate = date.toLocaleDateString("es-PE", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const formattedStart = date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const formattedEnd = endDateStr
      ? new Date(endDateStr).toLocaleTimeString("es-PE", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : null;
    return {
      dateLabel: formattedDate,
      timeLabel: formattedEnd ? `${formattedStart} - ${formattedEnd}` : formattedStart,
    };
  } catch {
    return { dateLabel: dateStr, timeLabel: "" };
  }
}

export function ScheduleSelectionSection({
  schedules,
  selectedScheduleId,
  onSelectSchedule,
  t,
}: ScheduleSelectionSectionProps) {
  if (!schedules || schedules.length <= 1) return null;

  return (
    <div className="space-y-3">
      <div className="space-y-1 text-left">
        <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-primary" />
          {t("register.scheduleSelectionTitle")}
        </label>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("register.scheduleSelectionHelp")}
        </p>
      </div>

      <div className="grid gap-2.5 pt-1">
        {schedules.map((slot, index) => {
          const isSelected = selectedScheduleId === slot.id;
          const { dateLabel, timeLabel } = formatSlotDateTime(slot.date, slot.endDate);

          return (
            <div
              key={slot.id}
              onClick={() => onSelectSchedule(slot.id)}
              className={`group cursor-pointer rounded-2xl border p-4 transition-all duration-200 text-left flex items-center justify-between gap-3 ${
                isSelected
                  ? "border-primary bg-primary/10 dark:bg-primary/20 ring-2 ring-primary shadow-sm"
                  : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
              }`}
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">
                    {slot.label || `Turno ${index + 1}`}
                  </span>
                  {isSelected && (
                    <span className="rounded-full bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider border border-primary/20">
                      Seleccionado
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium capitalize">
                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                    {dateLabel}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-foreground/90">
                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                    {timeLabel}
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <div
                  className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40 group-hover:border-primary/60"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
