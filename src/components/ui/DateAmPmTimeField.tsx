"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isBefore,
    isSameDay,
    isSameMonth,
    parseISO,
    startOfDay,
    startOfMonth,
    startOfWeek,
    subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
const WEEKDAY_LABELS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

function toDateKey(d: Date) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseDateKey(value: string | undefined): Date | null {
    if (!value?.trim()) return null;
    const parsed = parseISO(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return startOfDay(parsed);
}

function to24HourTime(hour12: string, minute: string, period: "AM" | "PM") {
    const parsedHour = Number(hour12);
    const hour24 = period === "PM" ? (parsedHour % 12) + 12 : parsedHour % 12;
    return `${String(hour24).padStart(2, "0")}:${minute}`;
}

type DateAmPmTimeFieldProps = {
    dateValue: string;
    timeValue: string;
    onDateChange: (date: string) => void;
    onTimeChange: (time: string) => void;
    /** YYYY-MM-DD — days before this cannot be selected */
    minDate?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    dateLabel?: string;
    timeLabel?: string;
    inputClassName?: string;
};

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
        setDateOpen(false);
    };

    const baseInput = cn(
        "w-full rounded-xl border border-border bg-background py-2.5 text-sm focus:border-primary focus:outline-none disabled:opacity-50",
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
                        className="absolute left-1.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none"
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
                            "pl-9 pr-3 text-left",
                            !selectedDay && "text-muted-foreground",
                        )}
                    >
                        {displayDate}
                    </button>
                </div>

                {dateOpen && !disabled && (
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
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
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
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
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
                                            "flex h-8 w-full items-center justify-center rounded-md text-xs transition-colors",
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
                                setDateOpen(false);
                            }}
                            className="mt-2 w-full rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                        >
                            Limpiar
                        </button>
                    </div>
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
                        className="absolute left-1.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none"
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
                    <div
                        role="dialog"
                        aria-label={timeLabel}
                        className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-xl"
                    >
                        <div className="grid grid-cols-3 gap-2">
                            <label className="space-y-1 text-xs font-medium">
                                <span>Hora</span>
                                <select
                                    value={hour12}
                                    autoFocus
                                    onChange={(e) =>
                                        onTimeChange(
                                            to24HourTime(e.target.value, minute || "00", period),
                                        )
                                    }
                                    className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm focus:border-primary focus:outline-none"
                                >
                                    <option value="">--</option>
                                    {HOUR_OPTIONS.map((h) => (
                                        <option key={h} value={h}>
                                            {h}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="space-y-1 text-xs font-medium">
                                <span>Min</span>
                                <select
                                    value={minute}
                                    onChange={(e) =>
                                        onTimeChange(
                                            to24HourTime(hour12 || "12", e.target.value, period),
                                        )
                                    }
                                    className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm focus:border-primary focus:outline-none"
                                >
                                    <option value="">--</option>
                                    {MINUTE_OPTIONS.map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="space-y-1 text-xs font-medium">
                                <span>AM/PM</span>
                                <select
                                    value={period}
                                    onChange={(e) =>
                                        onTimeChange(
                                            to24HourTime(
                                                hour12 || "12",
                                                minute || "00",
                                                e.target.value as "AM" | "PM",
                                            ),
                                        )
                                    }
                                    className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm focus:border-primary focus:outline-none"
                                >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </label>
                        </div>
                        <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
                            Usa AM/PM o el campo time. Minutos en intervalos de 5.
                        </p>
                        <button
                            type="button"
                            onClick={() => setTimeOpen(false)}
                            className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                            Listo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
