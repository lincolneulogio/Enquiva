"use client";

import React from "react";
import { Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CreateEventInput } from "@/lib/validations";
import type { ScheduleSlotState } from "./types";

const PRESET_LABELS = {
  en: ["Morning", "Afternoon", "Night", "Shift 1", "Shift 2", "Shift 3"],
  es: ["Turno Mañana", "Turno Tarde", "Turno Noche", "1er Turno", "2do Turno", "3er Turno"],
};

interface ScheduleSlotCardProps {
  slot: ScheduleSlotState;
  index: number;
  primaryDatePart?: string;
  minimumEventDate: string;
  locale: "es" | "en";
  handleSlotFieldChange: (
    index: number,
    field: "label" | "datePart" | "startTimePart" | "endTimePart",
    val: string,
  ) => void;
  handleCopyDateFromPrimary: (index: number) => void;
  handleRemoveScheduleSlot: (index: number) => void;
  getFieldHighlightClass: (field: keyof CreateEventInput) => string;
}

export function ScheduleSlotCard({
  slot,
  index,
  primaryDatePart,
  minimumEventDate,
  locale,
  handleSlotFieldChange,
  handleCopyDateFromPrimary,
  handleRemoveScheduleSlot,
  getFieldHighlightClass,
}: ScheduleSlotCardProps) {
  const isPrimary = index === 0;
  const presets = PRESET_LABELS[locale];

  return (
    <div
      className={cn(
        "rounded-xl border p-3.5 sm:p-4 transition-all space-y-3",
        isPrimary ? "border-primary/40 bg-primary/[0.02]" : "border-border/80 bg-background/50 hover:border-border",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold",
              isPrimary ? "bg-primary text-primary-foreground" : index === 1 ? "bg-blue-600 text-white" : "bg-emerald-600 text-white",
            )}
          >
            {isPrimary
              ? locale === "en" ? "Schedule 1 (Primary)" : "Horario 1 (Principal)"
              : locale === "en" ? `Schedule ${index + 1}` : `Horario ${index + 1}`}
          </span>
          {slot.label && (
            <span className="text-xs font-semibold text-muted-foreground truncate max-w-[200px]">
              • {slot.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {!isPrimary && primaryDatePart && slot.datePart !== primaryDatePart && (
            <button
              type="button"
              onClick={() => handleCopyDateFromPrimary(index)}
              className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title={locale === "en" ? "Copy date from Schedule 1" : "Copiar fecha del Horario 1"}
            >
              <Copy className="h-3 w-3" />
              <span className="hidden sm:inline">
                {locale === "en" ? "Same date as Slot 1" : "Misma fecha que Horario 1"}
              </span>
            </button>
          )}
          {!isPrimary && (
            <button
              type="button"
              onClick={() => handleRemoveScheduleSlot(index)}
              className="inline-flex items-center gap-1 rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title={locale === "en" ? "Remove schedule" : "Eliminar horario"}
              aria-label={locale === "en" ? `Remove schedule ${index + 1}` : `Eliminar horario ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick chips for preset labels */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[11px] font-medium text-muted-foreground mr-1">
          {locale === "en" ? "Label:" : "Etiqueta:"}
        </span>
        <input
          type="text"
          value={slot.label}
          onChange={(e) => handleSlotFieldChange(index, "label", e.target.value)}
          placeholder={
            isPrimary
              ? (locale === "en" ? "e.g. Morning Shift" : "ej. Turno Mañana")
              : index === 1
                ? (locale === "en" ? "e.g. Afternoon Shift" : "ej. Turno Tarde")
                : (locale === "en" ? "e.g. Evening Shift" : "ej. Turno Noche")
          }
          className="min-w-[140px] max-w-[220px] rounded-lg border border-border bg-background px-2.5 py-1 text-xs focus:border-primary focus:outline-none"
        />
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handleSlotFieldChange(index, "label", preset)}
            className={cn(
              "rounded-md border px-2 py-0.5 text-[11px] transition-colors",
              slot.label === preset
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Date, Start Time, End Time inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <div>
          <label htmlFor={`event-slot-${slot.id}-date`} className="mb-1 block text-xs font-medium text-muted-foreground">
            {locale === "en" ? "Date" : "Fecha"} <span className="text-destructive">*</span>
          </label>
          <input
            id={`event-slot-${slot.id}-date`}
            type="date"
            min={minimumEventDate || undefined}
            value={slot.datePart}
            onChange={(e) => handleSlotFieldChange(index, "datePart", e.target.value)}
            className={cn(
              "w-full rounded-xl border border-border bg-background py-2 px-3 text-xs focus:border-primary focus:outline-none",
              isPrimary && getFieldHighlightClass("date"),
            )}
          />
        </div>

        <div>
          <label htmlFor={`event-slot-${slot.id}-start`} className="mb-1 block text-xs font-medium text-muted-foreground">
            {locale === "en" ? "Start Time" : "Hora de Inicio"} <span className="text-destructive">*</span>
          </label>
          <input
            id={`event-slot-${slot.id}-start`}
            type="time"
            value={slot.startTimePart}
            onChange={(e) => handleSlotFieldChange(index, "startTimePart", e.target.value)}
            className={cn(
              "w-full rounded-xl border border-border bg-background py-2 px-3 text-xs focus:border-primary focus:outline-none",
              isPrimary && getFieldHighlightClass("date"),
            )}
          />
        </div>

        <div>
          <label htmlFor={`event-slot-${slot.id}-end`} className="mb-1 block text-xs font-medium text-muted-foreground">
            {locale === "en" ? "End Time (optional)" : "Hora de Fin (opcional)"}
          </label>
          <input
            id={`event-slot-${slot.id}-end`}
            type="time"
            value={slot.endTimePart}
            onChange={(e) => handleSlotFieldChange(index, "endTimePart", e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs focus:border-primary focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
