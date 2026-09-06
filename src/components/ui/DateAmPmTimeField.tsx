"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, isBefore, startOfDay, startOfMonth } from "date-fns";
import { CalendarDays, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DateAmPmTimeFieldProps,
    parseDateKey,
    DatePickerPopover,
    TimePickerPopover,
} from "./date-time";

export type { DateAmPmTimeFieldProps };

export function DateAmPmTimeField({
    dateValue,
    timeValue,
    onDateChange,
    onTimeChange,
    minDate,
    disabled,
    className,
    dateLabel = "Día",
    timeLabel = "Hora",
    inputClassName,
}: DateAmPmTimeFieldProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const [dateOpen, setDateOpen] = useState(false);
    const [timeOpen, setTimeOpen] = useState(false);

    const minDay = useMemo(() => parseDateKey(minDate) ?? startOfDay(new Date()), [minDate]);
    const selectedDay = useMemo(() => parseDateKey(dateValue), [dateValue]);

    const [viewMonth, setViewMonth] = useState(() =>
        startOfMonth(selectedDay && !isBefore(selectedDay, minDay) ? selectedDay : minDay),
    );

    useEffect(() => {
        if (!dateOpen) return;
        setViewMonth(
            startOfMonth(selectedDay && !isBefore(selectedDay, minDay) ? selectedDay : minDay),
        );
    }, [dateOpen, selectedDay, minDay]);

    useEffect(() => {
        if (!dateOpen && !timeOpen) return;
        const onOutside = (e: MouseEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) {
                setDateOpen(false);
                setTimeOpen(false);
            }
        };
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setDateOpen(false);
                setTimeOpen(false);
            }
        };
        document.addEventListener("mousedown", onOutside);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onOutside);
            document.removeEventListener("keydown", onEsc);
        };
    }, [dateOpen, timeOpen]);

    const hour24 = Number(timeValue.slice(0, 2) || 0);
    const hour12 = timeValue ? String(hour24 % 12 || 12).padStart(2, "0") : "";
    const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
    const minute = timeValue.slice(3, 5);

    const displayDate = selectedDay
        ? format(selectedDay, "dd/MM/yyyy")
        : "dd / mm / aaaa";

    const baseInput = cn(
        "w-full rounded-xl border border-border bg-background py-2.5 text-sm focus:border-primary focus:outline-hidden disabled:opacity-50",
        inputClassName,
    );

    return (
        <div ref={rootRef} className={cn("grid grid-cols-2 gap-2", className)}>
            <div className="relative">
                <label className="mb-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <CalendarDays className="h-3 w-3" /> {dateLabel}
                </label>
                <div className="relative">
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                            setTimeOpen(false);
                            setDateOpen((o) => !o);
                        }}
                        aria-label={dateLabel}
                        aria-expanded={dateOpen}
                        className="absolute left-1.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none cursor-pointer"
                    >
                        <CalendarDays className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                            setTimeOpen(false);
                            setDateOpen((o) => !o);
                        }}
                        className={cn(
                            baseInput,
                            "pl-9 pr-3 text-left cursor-pointer",
                            !selectedDay && "text-muted-foreground",
                        )}
                    >
                        {displayDate}
                    </button>
                </div>

                {dateOpen && !disabled && (
                    <DatePickerPopover
                        dateLabel={dateLabel}
                        viewMonth={viewMonth}
                        setViewMonth={setViewMonth}
                        minDay={minDay}
                        selectedDay={selectedDay}
                        onDateChange={onDateChange}
                        onClose={() => setDateOpen(false)}
                    />
                )}
            </div>

            <div className="relative">
                <label className="mb-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> {timeLabel}
                </label>
                <div className="relative">
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                            setDateOpen(false);
                            setTimeOpen((o) => !o);
                        }}
                        aria-label={timeLabel}
                        aria-expanded={timeOpen}
                        className="absolute left-1.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none cursor-pointer"
                    >
                        <Clock className="h-4 w-4" aria-hidden />
                    </button>
                    <input
                        type="time"
                        value={timeValue}
                        disabled={disabled}
                        onChange={(e) => onTimeChange(e.target.value)}
                        onFocus={() => {
                            setDateOpen(false);
                            setTimeOpen(true);
                        }}
                        className={cn(baseInput, "pl-9 pr-3")}
                    />
                </div>

                {timeOpen && !disabled && (
                    <TimePickerPopover
                        timeLabel={timeLabel}
                        hour12={hour12}
                        minute={minute}
                        period={period}
                        onTimeChange={onTimeChange}
                        onClose={() => setTimeOpen(false)}
                    />
                )}
            </div>
        </div>
    );
}
