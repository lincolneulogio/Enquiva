import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { buildWhatsAppChatUrl } from "@/lib/share/whatsapp";
import { detectShiftFromTime, isGenericShiftLabel } from "@/lib/events/schedule-utils";

export function splitLocation(location: string | null | undefined) {
  const rawLocation =
    location ||
    "Parque Plaza de Armas, Jirón General Prado, Loma Blanca, Huánuco";
  const [firstPart, ...restParts] = rawLocation.split(",");
  const locationName = firstPart.trim();
  const locationAddress =
    restParts.length > 0 ? restParts.join(",").trim() : "Huánuco, Perú";
  return { rawLocation, locationName, locationAddress };
}

export function formatDisplayDate(date: Date, locale: string) {
  const fullDateStr = new Date(date).toLocaleDateString(
    locale === "en" ? "en-US" : "es-PE",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
  return fullDateStr.charAt(0).toUpperCase() + fullDateStr.slice(1);
}

export function buildSchedulesForDisplay(
  event: {
    date: Date;
    endDate?: Date | null;
    schedules?: Array<{ id?: string; label?: string | null; date?: Date | string | null; endDate?: Date | string | null }> | null;
  },
  locale: string,
) {
  if (!event.schedules || event.schedules.length === 0) {
    const slotDate = new Date(event.date);
    const startTimeStr = !Number.isNaN(slotDate.getTime())
      ? slotDate.toLocaleTimeString(
          locale === "en" ? "en-US" : "es-PE",
          { hour: "2-digit", minute: "2-digit", hour12: true },
        )
      : "";
    const hasEndTime = Boolean(event.endDate && !Number.isNaN(new Date(event.endDate).getTime()));
    const endTimeStr = hasEndTime
      ? new Date(event.endDate!).toLocaleTimeString(
          locale === "en" ? "en-US" : "es-PE",
          { hour: "2-digit", minute: "2-digit", hour12: true },
        )
      : null;

    const detectedShift = detectShiftFromTime(slotDate, locale as "es" | "en");

    return [
      {
        id: "slot-main",
        label: locale === "en" ? "Main Schedule" : "Horario Principal",
        timeRange: endTimeStr ? `${startTimeStr} - ${endTimeStr}` : `${startTimeStr} - --`,
        description: "Acceso a todas las actividades programadas",
        badgeText: locale === "en" ? "Selected" : "Seleccionado",
        badgeVariant: "selected" as const,
        date: event.date,
      },
    ];
  }

  return event.schedules.map((slot, index) => {
    const slotDate = slot.date ? new Date(slot.date) : new Date(event.date);
    const detectedShift = detectShiftFromTime(slotDate, locale as "es" | "en");
    const startTimeStr = !Number.isNaN(slotDate.getTime())
      ? slotDate.toLocaleTimeString(
          locale === "en" ? "en-US" : "es-PE",
          { hour: "2-digit", minute: "2-digit", hour12: true },
        )
      : "";
    const hasEndTime = Boolean(slot.endDate && !Number.isNaN(new Date(slot.endDate).getTime()));
    const endTimeStr = hasEndTime
      ? new Date(slot.endDate!).toLocaleTimeString(
          locale === "en" ? "en-US" : "es-PE",
          { hour: "2-digit", minute: "2-digit", hour12: true },
        )
      : null;
    const isSelected = index === 0;

    return {
      id: slot.id || `slot-${index}`,
      label:
        slot.label && !isGenericShiftLabel(slot.label)
          ? slot.label
          : (slot.label?.trim() || detectedShift.label),
      timeRange: endTimeStr ? `${startTimeStr} - ${endTimeStr}` : `${startTimeStr} - --`,
      description:
        index === 0
          ? "Conferencias magistrales y apertura"
          : index === 1
            ? "Talleres prácticos en innovación"
            : "Networking & Pitch de proyectos",
      badgeText: isSelected
        ? (locale === "en" ? "Selected" : "Seleccionado")
        : index === 1
          ? (locale === "en" ? "Available slots" : "Cupos disponibles")
          : "Acceso VIP / Networking",
      badgeVariant: (isSelected
        ? "selected"
        : index === 1
          ? "available"
          : "vip") as "selected" | "available" | "vip",
      date: slotDate,
    };
  });
}

export async function resolveWhatsAppContactUrl(
  event: { title: string; organizerId?: string | null },
  orgBrand: { whatsappNumber?: string | null } | null,
  locale: string,
) {
  let contactPhone = orgBrand?.whatsappNumber || null;
  if (!contactPhone && event.organizerId) {
    const organizerOrg = await OrganizationService.getOrganizationForUser(event.organizerId).catch(() => null);
    if (organizerOrg?.whatsappNumber) {
      contactPhone = organizerOrg.whatsappNumber;
    } else {
      const [organizerUser] = await db
        .select({ phone: users.phone })
        .from(users)
        .where(eq(users.id, event.organizerId))
        .limit(1)
        .catch(() => []);
      if (organizerUser?.phone) {
        contactPhone = organizerUser.phone;
      }
    }
  }

  return contactPhone
    ? buildWhatsAppChatUrl({
        phone: contactPhone,
        text:
          locale === "en"
            ? `Hello! I would like more information about the event "${event.title}".`
            : `¡Hola! Me gustaría obtener más información sobre el evento "${event.title}".`,
      })
    : null;
}
