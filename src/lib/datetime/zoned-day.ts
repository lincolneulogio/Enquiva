import { normalizePlatformTimezone } from "@/lib/settings/platform-locale";

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
}

export function formatDateKeyInTimeZone(date: Date, timeZone: string): string {
  const tz = normalizePlatformTimezone(timeZone);
  const p = getZonedParts(date, tz);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

/** Instant UTC correspondiente a una hora local en la zona dada. */
export function zonedLocalToUtc(
  dateKey: string,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  const tz = normalizePlatformTimezone(timeZone);
  const [y, mo, d] = dateKey.split("-").map(Number);
  let guess = Date.UTC(y, mo - 1, d, hour, minute, second);

  for (let i = 0; i < 5; i++) {
    const parts = getZonedParts(new Date(guess), tz);
    const asIfUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
    const target = Date.UTC(y, mo - 1, d, hour, minute, second);
    guess += target - asIfUtc;
  }

  return new Date(guess);
}

export function getCalendarDayUtcRange(
  dateKey: string,
  timeZone: string,
): { start: Date; endExclusive: Date } {
  const tz = normalizePlatformTimezone(timeZone);
  const start = zonedLocalToUtc(dateKey, 0, 0, 0, tz);
  const endExclusive = zonedLocalToUtc(addDaysToDateKey(dateKey, 1), 0, 0, 0, tz);
  return { start, endExclusive };
}

export function getLocalHour(date: Date, timeZone: string): number {
  return getZonedParts(date, normalizePlatformTimezone(timeZone)).hour;
}

/** Día civil anterior en la zona (YYYY-MM-DD). */
export function getPreviousDateKey(now: Date, timeZone: string): string {
  const today = formatDateKeyInTimeZone(now, timeZone);
  return addDaysToDateKey(today, -1);
}

/** Valor para `<input type="datetime-local">` en la zona indicada. */
export function toDatetimeLocalValue(
  date: Date | string | null | undefined,
  timeZone: string,
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const p = getZonedParts(d, normalizePlatformTimezone(timeZone));
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}T${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** Interpreta datetime-local como hora de pared en la zona de plataforma → Instant UTC. */
export function fromDatetimeLocalValue(
  value: string | null | undefined,
  timeZone: string,
): Date | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const [datePart, timePart = "00:00"] = raw.split("T");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
  const [hourStr = "0", minuteStr = "0"] = timePart.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return zonedLocalToUtc(datePart, hour, minute, 0, timeZone);
}

export function isWithinInclusiveStartWindow(
  now: Date,
  startsAt: Date | null | undefined,
  endsAt: Date | null | undefined,
): boolean {
  if (startsAt && now.getTime() < startsAt.getTime()) return false;
  if (endsAt && now.getTime() >= endsAt.getTime()) return false;
  return true;
}
