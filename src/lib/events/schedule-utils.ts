export type ShiftKey = "morning" | "afternoon" | "night";

export interface ShiftInfo {
  key: ShiftKey;
  label: string;
  badge: string;
  period: "AM" | "PM";
}

export function detectShiftFromTime(
  dateOrTimeString?: string | Date | null,
  locale: "es" | "en" = "es",
): ShiftInfo {
  let hours = 9; // Fallback predeterminado

  if (dateOrTimeString instanceof Date) {
    if (!Number.isNaN(dateOrTimeString.getTime())) {
      hours = dateOrTimeString.getHours();
    }
  } else if (typeof dateOrTimeString === "string" && dateOrTimeString.trim()) {
    const trimmed = dateOrTimeString.trim();
    // Extraer la parte de hora directamente si está en formato HH:mm o YYYY-MM-DDTHH:mm
    const timePart = trimmed.includes("T") ? trimmed.split("T")[1] : trimmed;
    if (timePart && timePart.includes(":")) {
      const [hoursPart] = timePart.split(":");
      const parsed = parseInt(hoursPart, 10);
      if (!Number.isNaN(parsed)) {
        hours = parsed;
      }
    } else {
      const d = new Date(trimmed);
      if (!Number.isNaN(d.getTime())) {
        hours = d.getHours();
      }
    }
  }

  // 05:00 a 11:59 -> Mañana (AM)
  if (hours >= 5 && hours < 12) {
    return {
      key: "morning",
      label: locale === "en" ? "Morning Shift" : "Turno Mañana",
      badge: locale === "en" ? "Morning (AM)" : "Mañana (AM)",
      period: "AM",
    };
  }

  // 12:00 a 18:59 -> Tarde (PM)
  if (hours >= 12 && hours < 19) {
    return {
      key: "afternoon",
      label: locale === "en" ? "Afternoon Shift" : "Turno Tarde",
      badge: locale === "en" ? "Afternoon (PM)" : "Tarde (PM)",
      period: "PM",
    };
  }

  // 19:00 a 04:59 -> Noche (PM)
  return {
    key: "night",
    label: locale === "en" ? "Night Shift" : "Turno Noche",
    badge: locale === "en" ? "Night (PM)" : "Noche (PM)",
    period: hours < 5 ? "AM" : "PM",
  };
}

/**
 * Determina si una etiqueta de turno es genérica/automática (para poder actualizarla
 * automáticamente si el usuario cambia la hora, sin pisar nombres personalizados).
 */
export function isGenericShiftLabel(label?: string | null): boolean {
  if (!label) return true;
  const normalized = label.trim().toLowerCase();
  return (
    normalized === "" ||
    normalized.startsWith("horario") ||
    normalized.startsWith("schedule") ||
    normalized.includes("turno mañana") ||
    normalized.includes("turno tarde") ||
    normalized.includes("turno noche") ||
    normalized.includes("morning shift") ||
    normalized.includes("afternoon shift") ||
    normalized.includes("night shift")
  );
}
