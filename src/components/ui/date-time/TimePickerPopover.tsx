"use client";

import { HOUR_OPTIONS, MINUTE_OPTIONS, to24HourTime } from "./helpers";

interface TimePickerPopoverProps {
    timeLabel: string;
    hour12: string;
    minute: string;
    period: "AM" | "PM";
    onTimeChange: (time: string) => void;
    onClose: () => void;
}

export function TimePickerPopover({
    timeLabel,
    hour12,
    minute,
    period,
    onTimeChange,
    onClose,
}: TimePickerPopoverProps) {
    return (
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
                        className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm focus:border-primary focus:outline-hidden cursor-pointer"
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
                        className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm focus:border-primary focus:outline-hidden cursor-pointer"
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
                        className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm focus:border-primary focus:outline-hidden cursor-pointer"
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
                onClick={onClose}
                className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
                Listo
            </button>
        </div>
    );
}
