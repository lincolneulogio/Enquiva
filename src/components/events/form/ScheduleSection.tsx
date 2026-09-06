"use client";

import React from "react";
import { CalendarDays, Plus, Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldErrors } from "react-hook-form";
import type { CreateEventInput } from "@/lib/validations";
import type { ScheduleSlotState } from "./types";

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
    return (
        <div className="rounded-2xl border border-border/70 bg-card/40 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3.5">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <CalendarDays className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-bold text-foreground">
                            {locale === "en" ? "Event Schedules & Shifts" : "Horarios y Turnos del Evento"}
                        </h4>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                            {scheduleSlots.length} / 3{" "}
                            {scheduleSlots.length === 1
                                ? locale === "en"
                                    ? "schedule"
                                    : "horario"
                                : locale === "en"
                                  ? "schedules"
                                  : "horarios"}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {locale === "en"
                            ? "Configure 1, 2, or up to 3 schedules/shifts for this event (e.g. morning, afternoon, evening)."
                            : "Configura de 1 a 3 horarios o turnos para tu evento (ej. mañana, tarde o noche)."}
                    </p>
                </div>

                {scheduleSlots.length < 3 && (
                    <button
                        type="button"
                        onClick={handleAddScheduleSlot}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-all active:scale-95 shrink-0 self-start sm:self-auto"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        {locale === "en"
                            ? `+ Add Schedule ${scheduleSlots.length + 1}`
                            : `+ Agregar Horario ${scheduleSlots.length + 1}`}
                    </button>
                )}
            </div>

            {/* List of schedule slots */}
            <div className="space-y-3.5">
                {scheduleSlots.map((slot, index) => (
                    <div
                        key={slot.id}
                        className={cn(
                            "rounded-xl border p-3.5 sm:p-4 transition-all space-y-3",
                            index === 0
                                ? "border-primary/40 bg-primary/[0.02]"
                                : "border-border/80 bg-background/50 hover:border-border",
                        )}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold",
                                        index === 0
                                            ? "bg-primary text-primary-foreground"
                                            : index === 1
                                              ? "bg-blue-600 text-white"
                                              : "bg-emerald-600 text-white",
                                    )}
                                >
                                    {index === 0
                                        ? locale === "en"
                                            ? "Schedule 1 (Primary)"
                                            : "Horario 1 (Principal)"
                                        : locale === "en"
                                          ? `Schedule ${index + 1}`
                                          : `Horario ${index + 1}`}
                                </span>
                                {slot.label && (
                                    <span className="text-xs font-semibold text-muted-foreground truncate max-w-[200px]">
                                        • {slot.label}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-1.5">
                                {index > 0 &&
                                    scheduleSlots[0]?.datePart &&
                                    slot.datePart !== scheduleSlots[0].datePart && (
                                        <button
                                            type="button"
                                            onClick={() => handleCopyDateFromPrimary(index)}
                                            className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                            title={
                                                locale === "en"
                                                    ? "Copy date from Schedule 1"
                                                    : "Copiar fecha del Horario 1"
                                            }
                                        >
                                            <Copy className="h-3 w-3" />
                                            <span className="hidden sm:inline">
                                                {locale === "en"
                                                    ? "Same date as Slot 1"
                                                    : "Misma fecha que Horario 1"}
                                            </span>
                                        </button>
                                    )}
                                {index > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveScheduleSlot(index)}
                                        className="inline-flex items-center gap-1 rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        title={locale === "en" ? "Remove schedule" : "Eliminar horario"}
                                        aria-label={
                                            locale === "en"
                                                ? `Remove schedule ${index + 1}`
                                                : `Eliminar horario ${index + 1}`
                                        }
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
                                    index === 0
                                        ? locale === "en"
                                            ? "e.g. Morning Shift"
                                            : "ej. Turno Mañana"
                                        : index === 1
                                          ? locale === "en"
                                              ? "e.g. Afternoon Shift"
                                              : "ej. Turno Tarde"
                                          : locale === "en"
                                            ? "e.g. Evening Shift"
                                            : "ej. Turno Noche"
                                }
                                className="min-w-[140px] max-w-[220px] rounded-lg border border-border bg-background px-2.5 py-1 text-xs focus:border-primary focus:outline-none"
                            />
                            {(locale === "en"
                                ? ["Morning", "Afternoon", "Night", "Shift 1", "Shift 2", "Shift 3"]
                                : [
                                      "Turno Mañana",
                                      "Turno Tarde",
                                      "Turno Noche",
                                      "1er Turno",
                                      "2do Turno",
                                      "3er Turno",
                                  ]
                            ).map((preset) => (
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
                                <label
                                    htmlFor={`event-slot-${slot.id}-date`}
                                    className="mb-1 block text-xs font-medium text-muted-foreground"
                                >
                                    {locale === "en" ? "Date" : "Fecha"}{" "}
                                    <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id={`event-slot-${slot.id}-date`}
                                        type="date"
                                        min={minimumEventDate || undefined}
                                        value={slot.datePart}
                                        onChange={(e) =>
                                            handleSlotFieldChange(index, "datePart", e.target.value)
                                        }
                                        className={cn(
                                            "w-full rounded-xl border border-border bg-background py-2 px-3 text-xs focus:border-primary focus:outline-none",
                                            index === 0 && getFieldHighlightClass("date"),
                                        )}
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor={`event-slot-${slot.id}-start`}
                                    className="mb-1 block text-xs font-medium text-muted-foreground"
                                >
                                    {locale === "en" ? "Start Time" : "Hora de Inicio"}{" "}
                                    <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id={`event-slot-${slot.id}-start`}
                                        type="time"
                                        value={slot.startTimePart}
                                        onChange={(e) =>
                                            handleSlotFieldChange(index, "startTimePart", e.target.value)
                                        }
                                        className={cn(
                                            "w-full rounded-xl border border-border bg-background py-2 px-3 text-xs focus:border-primary focus:outline-none",
                                            index === 0 && getFieldHighlightClass("date"),
                                        )}
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor={`event-slot-${slot.id}-end`}
                                    className="mb-1 block text-xs font-medium text-muted-foreground"
                                >
                                    {locale === "en" ? "End Time (optional)" : "Hora de Fin (opcional)"}
                                </label>
                                <div className="relative">
                                    <input
                                        id={`event-slot-${slot.id}-end`}
                                        type="time"
                                        value={slot.endTimePart}
                                        onChange={(e) =>
                                            handleSlotFieldChange(index, "endTimePart", e.target.value)
                                        }
                                        className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs focus:border-primary focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {errors.date && (
                <p id="event-date-error" role="alert" className="mt-1 text-xs text-destructive">
                    {scheduleSlots[0]?.datePart && !scheduleSlots[0]?.startTimePart
                        ? locale === "en"
                            ? "Start time is required for primary schedule"
                            : "La hora de inicio es requerida para el horario principal"
                        : getLocalizedValidationMessage(errors.date.message)}
                </p>
            )}
        </div>
    );
}
