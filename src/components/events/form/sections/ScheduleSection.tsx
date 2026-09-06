"use client";

import React from "react";
import { CalendarDays, Plus } from "lucide-react";
import type { FieldErrors } from "react-hook-form";
import type { CreateEventInput } from "@/lib/validations";
import type { ScheduleSlotState } from "../types";
import { ScheduleSlotCard } from "./ScheduleSlotCard";

interface ScheduleSectionProps {
  scheduleSlots: ScheduleSlotState[];
  minimumEventDate: string;
  locale: "es" | "en";
  handleAddScheduleSlot: () => void;
  handleRemoveScheduleSlot: (index: number) => void;
  handleCopyDateFromPrimary: (index: number) => void;
  handleSlotFieldChange: (index: number, field: "label" | "datePart" | "startTimePart" | "endTimePart", val: string) => void;
  errors: FieldErrors<CreateEventInput>;
  getFieldHighlightClass: (field: keyof CreateEventInput) => string;
  getLocalizedValidationMessage: (message?: string) => string;
}

export function ScheduleSection({
  scheduleSlots,
  minimumEventDate,
  locale,
  handleAddScheduleSlot,
  handleRemoveScheduleSlot,
  handleCopyDateFromPrimary,
  handleSlotFieldChange,
  errors,
  getFieldHighlightClass,
  getLocalizedValidationMessage,
}: ScheduleSectionProps) {
  const primaryDatePart = scheduleSlots[0]?.datePart;

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              {locale === "en" ? "Event Schedules & Shifts" : "Horarios y Turnos del Evento"}
            </h3>
            <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {scheduleSlots.length} / 3{" "}
              {scheduleSlots.length === 1
                ? (locale === "en" ? "Horario" : "Horario")
                : (locale === "en" ? "Horarios" : "Horarios")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 ml-10">
            {locale === "en"
              ? "Configure 1, 2, or up to 3 schedules/shifts for this event (e.g. morning, afternoon, evening)."
              : "Configura los horarios si manejas tu evento en diferentes turnos (ej. mañana, tarde o noche)."}
          </p>
        </div>

        {scheduleSlots.length < 3 && (
          <button
            type="button"
            onClick={handleAddScheduleSlot}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-all active:scale-95 shrink-0 self-start sm:self-auto cursor-pointer shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            {locale === "en"
              ? `+ Add Schedule ${scheduleSlots.length + 1}`
              : `+ Agregar Horario ${scheduleSlots.length + 1}`}
          </button>
        )}
      </div>

      <div className="space-y-3.5">
        {scheduleSlots.map((slot, index) => (
          <ScheduleSlotCard
            key={slot.id}
            slot={slot}
            index={index}
            primaryDatePart={primaryDatePart}
            minimumEventDate={minimumEventDate}
            locale={locale}
            handleSlotFieldChange={handleSlotFieldChange}
            handleCopyDateFromPrimary={handleCopyDateFromPrimary}
            handleRemoveScheduleSlot={handleRemoveScheduleSlot}
            getFieldHighlightClass={getFieldHighlightClass}
          />
        ))}
      </div>

      {errors.date && (
        <p id="event-date-error" role="alert" className="mt-1 text-xs text-destructive">
          {scheduleSlots[0]?.datePart && !scheduleSlots[0]?.startTimePart
            ? (locale === "en"
              ? "Start time is required for primary schedule"
              : "La hora de inicio es requerida para el horario principal")
            : getLocalizedValidationMessage(errors.date.message)}
        </p>
      )}
    </div>
  );
}
