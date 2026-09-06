import { parseISO, startOfDay } from "date-fns";

export const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
export const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
export const WEEKDAY_LABELS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

export function pad2(n: number) {
    return String(n).padStart(2, "0");
}

export function toDateKey(d: Date) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseDateKey(value: string | undefined): Date | null {
    if (!value?.trim()) return null;
    const parsed = parseISO(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return startOfDay(parsed);
}

export function to24HourTime(hour12: string, minute: string, period: "AM" | "PM") {
    const parsedHour = Number(hour12);
    const hour24 = period === "PM" ? (parsedHour % 12) + 12 : parsedHour % 12;
    return `${String(hour24).padStart(2, "0")}:${minute}`;
}
