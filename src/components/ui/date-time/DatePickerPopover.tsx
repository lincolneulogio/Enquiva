"use client";

import { useMemo } from "react";
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isBefore,
    isSameDay,
    isSameMonth,
    startOfMonth,
    startOfWeek,
    subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { WEEKDAY_LABELS, toDateKey } from "./helpers";

interface DatePickerPopoverProps {
    dateLabel: string;
    viewMonth: Date;
    setViewMonth: React.Dispatch<React.SetStateAction<Date>>;
    minDay: Date;
    selectedDay: Date | null;
    onDateChange: (date: string) => void;
    onClose: () => void;
}

export function DatePickerPopover({
    dateLabel,
    viewMonth,
    setViewMonth,
    minDay,
    selectedDay,
    onDateChange,
    onClose,
}: DatePickerPopoverProps) {
    const calendarDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [viewMonth]);

    const canGoPrevMonth =
        startOfMonth(viewMonth).getTime() > startOfMonth(minDay).getTime();

    const goPrevMonth = () => {
        if (!canGoPrevMonth) return;
        setViewMonth((m) => startOfMonth(subMonths(m, 1)));
    };

    const goNextMonth = () => {
        setViewMonth((m) => startOfMonth(addMonths(m, 1)));
    };

    const pickDay = (day: Date) => {
        if (isBefore(day, minDay)) return;
        onDateChange(toDateKey(day));
        onClose();
    };

    return (
        <div
            role="dialog"
            aria-label={dateLabel}
            className="absolute left-0 top-[calc(100%+0.5rem)] z-40 w-[17.5rem] rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-xl"
        >
            <div className="mb-2 flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={goPrevMonth}
                    disabled={!canGoPrevMonth}
                    aria-label="Mes anterior"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <p className="select-none font-display text-sm font-semibold capitalize tracking-tight text-foreground">
                    {format(viewMonth, "MMMM yyyy", { locale: es })}
                </p>
                <button
                    type="button"
                    onClick={goNextMonth}
                    aria-label="Mes siguiente"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted cursor-pointer"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-0.5">
                {WEEKDAY_LABELS.map((label) => (
                    <span
                        key={label}
                        className="py-1 text-center text-[10px] font-medium text-muted-foreground"
                    >
                        {label}
                    </span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((day) => {
                    const inMonth = isSameMonth(day, viewMonth);
                    const beforeMin = isBefore(day, minDay);
                    const selected = selectedDay ? isSameDay(day, selectedDay) : false;
                    const isToday = isSameDay(day, new Date());
                    const blocked = beforeMin || !inMonth;

                    return (
                        <button
                            key={toDateKey(day)}
                            type="button"
                            disabled={blocked}
                            onClick={() => pickDay(day)}
                            aria-label={format(day, "d MMMM yyyy", { locale: es })}
                            aria-disabled={blocked}
                            className={cn(
                                "flex h-8 w-full items-center justify-center rounded-md text-xs transition-colors cursor-pointer",
                                selected &&
                                    "bg-primary font-semibold text-primary-foreground hover:bg-primary",
                                !selected &&
                                    !blocked &&
                                    "text-foreground hover:bg-muted",
                                !selected &&
                                    isToday &&
                                    !blocked &&
                                    "ring-1 ring-primary/40",
                                blocked &&
                                    "cursor-not-allowed text-muted-foreground/35 opacity-40",
                                !inMonth && "invisible pointer-events-none",
                            )}
                        >
                            {format(day, "d")}
                        </button>
                    );
                })}
            </div>

            <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
                Los días anteriores a hoy aparecen deshabilitados. Mes y año no se editan a mano.
            </p>
            <button
                type="button"
                onClick={() => {
                    onDateChange("");
                    onClose();
                }}
                className="mt-2 w-full rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted cursor-pointer"
            >
                Limpiar
            </button>
        </div>
    );
}
