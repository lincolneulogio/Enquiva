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
        "rounded-xl border p-4 sm:p-5 transition-all space-y-4",
        isPrimary ? "border-primary/30 bg-primary/[0.02] shadow-xs" : "border-border/80 bg-card/60 hover:border-border",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold tracking-wide uppercase",
              isPrimary
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-muted text-muted-foreground border border-border",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", isPrimary ? "bg-primary" : "bg-muted-foreground")} />
            {isPrimary
              ? locale === "en" ? "Schedule 1 (Principal)" : "Horario 1 (Principal)"
              : locale === "en" ? `Schedule ${index + 1}` : `Horario ${index + 1}`}
          </span>
          {slot.label && (
            <span className="text-xs font-semibold text-foreground/80 truncate max-w-[160px] sm:max-w-none">
              • {slot.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {locale === "en" ? "Active" : "Activo"}
          </span>
          {!isPrimary && (
            <button
              type="button"
              onClick={() => handleRemoveScheduleSlot(index)}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive cursor-pointer"
              title={locale === "en" ? "Remove schedule" : "Eliminar horario"}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {locale === "en" ? "Shift presets:" : "Preajustes de turno:"}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {presets.slice(0, 4).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSlotFieldChange(index, "label", preset)}
                className={cn(
                  "rounded-lg border px-3 py-1 text-xs font-semibold transition-all cursor-pointer shadow-2xs",
                  slot.label === preset
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border/80 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-muted-foreground">
            {locale === "en" ? "Schedule Label / Name" : "Nombre / Etiqueta del Horario"}
          </label>
          <input
            type="text"
            value={slot.label}
            onChange={(e) => handleSlotFieldChange(index, "label", e.target.value)}
            placeholder={locale === "en" ? "e.g. Morning Shift, Workshop Room A" : "ej. 1er Turno, Mañana, Sala A"}
            className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-sm font-medium text-foreground transition-all hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 pt-1">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {locale === "en" ? "Date" : "Fecha"} <span className="text-destructive">*</span>
            </label>
            {!isPrimary && primaryDatePart && slot.datePart !== primaryDatePart && (
              <button
                type="button"
                onClick={() => handleCopyDateFromPrimary(index)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                title={locale === "en" ? "Same date as Schedule 1" : "Misma fecha que Horario 1"}
              >
                <Copy className="h-3 w-3" />
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
              "w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-sm font-medium text-foreground transition-all hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
              isPrimary ? getFieldHighlightClass("date") : "",
            )}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {locale === "en" ? "Start Time" : "Hora de inicio"} <span className="text-destructive">*</span>
          </label>
          <input
            type="time"
            value={slot.startTimePart}
            onChange={(e) => handleSlotFieldChange(index, "startTimePart", e.target.value)}
            className={cn(
              "w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-sm font-medium text-foreground transition-all hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
              isPrimary ? getFieldHighlightClass("date") : "",
            )}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {locale === "en" ? "End Time (optional)" : "Hora de fin (opcional)"}
          </label>
          <input
            type="time"
            value={slot.endTimePart}
            onChange={(e) => handleSlotFieldChange(index, "endTimePart", e.target.value)}
            className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-sm font-medium text-foreground transition-all hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
    </div>
  );
}
