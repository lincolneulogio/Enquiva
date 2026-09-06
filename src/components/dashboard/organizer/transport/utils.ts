function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function toLocalDatePart(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function toLocalTimePart(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function combineDateAndTime(datePart: string, timePart: string): string {
  if (!datePart.trim() || !timePart.trim()) return "";
  return `${datePart}T${timePart}`;
}

export function todayDatePart(): string {
  return toLocalDatePart(new Date());
}

export function isPastCombined(datePart: string, timePart: string): boolean {
  const combined = combineDateAndTime(datePart, timePart);
  if (!combined) return false;
  const parsed = new Date(combined);
  if (Number.isNaN(parsed.getTime())) return true;
  return parsed.getTime() < Date.now() - 60_000;
}

export function isPastDatetimeLocal(value: string): boolean {
  if (!value.trim()) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return true;
  return parsed.getTime() < Date.now() - 60_000;
}
