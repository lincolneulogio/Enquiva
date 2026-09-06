"use client";

import React from "react";
import { Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CreateEventInput } from "@/lib/validations";
import type { ScheduleSlotState } from "../types";

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
          <span className="text-xs text-muted-foreground font-medium truncate max-w-[140px] sm:max-w-none">
            {slot.label || `Horario ${index + 1}`}
          </span>
        </div>
        {!isPrimary && (
          <button
            type="button"
            onClick={() => handleRemoveScheduleSlot(index)}
            className="rounded-lg p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive cursor-pointer"
            title={locale === "en" ? "Remove schedule" : "Eliminar horario"}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-muted-foreground">
          {locale === "en" ? "Schedule Name / Description" : "Nombre / Etiqueta del Horario"}
        </label>
        <div className="flex flex-wrap gap-1 mb-1.5">
          {presets.slice(0, 4).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleSlotFieldChange(index, "label", preset)}
              className={cn(
                "rounded-md border px-2 py-0.5 text-[11px] font-medium transition cursor-pointer",
                slot.label === preset
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border/70 bg-background hover:border-primary/50 text-muted-foreground hover:text-foreground",
              )}
            >
              {preset}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={slot.label}
          onChange={(e) => handleSlotFieldChange(index, "label", e.target.value)}
          placeholder={locale === "en" ? "e.g. Morning Shift, Workshop Room A" : "ej. Turno Mañana, Sala 1, Taller Especial"}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-muted-foreground">
              {locale === "en" ? "Date" : "Fecha"} <span className="text-destructive">*</span>
            </label>
            {!isPrimary && primaryDatePart && slot.datePart !== primaryDatePart && (
              <button
                type="button"
                onClick={() => handleCopyDateFromPrimary(index)}
                className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline cursor-pointer"
                title={locale === "en" ? "Same date as Schedule 1" : "Misma fecha que Horario 1"}
              >
                <Copy className="h-2.5 w-2.5" />
                <span>{locale === "en" ? "Same date" : "Misma fecha"}</span>
              </button>
            )}
          </div>
          <input
            type="date"
            min={minimumEventDate}
            value={slot.datePart}
            onChange={(e) => handleSlotFieldChange(index, "datePart", e.target.value)}
            className={cn(
              "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none",
              isPrimary ? getFieldHighlightClass("date") : "",
            )}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-muted-foreground">
            {locale === "en" ? "Start Time" : "Hora de Inicio"} <span className="text-destructive">*</span>
          </label>
          <input
            type="time"
            value={slot.startTimePart}
            onChange={(e) => handleSlotFieldChange(index, "startTimePart", e.target.value)}
            className={cn(
              "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none",
              isPrimary ? getFieldHighlightClass("date") : "",
            )}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-muted-foreground">
            {locale === "en" ? "End Time (optional)" : "Hora de Fin (opcional)"}
          </label>
          <input
            type="time"
            value={slot.endTimePart}
            onChange={(e) => handleSlotFieldChange(index, "endTimePart", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
