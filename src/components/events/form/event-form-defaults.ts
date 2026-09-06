import type { CreateEventInput } from "@/lib/validations";
import type { Event } from "@/lib/db/schema";
import { toLocalDateTimeInputValue } from "./types";

export function getEventFormDefaultValues(event?: Event): Partial<CreateEventInput> {
  if (event) {
    return {
      title: event.title,
      description: event.description,
      category: event.category,
      date: toLocalDateTimeInputValue(event.date),
      endDate: event.endDate ? toLocalDateTimeInputValue(event.endDate) : undefined,
      schedules: event.schedules ?? undefined,
      location: event.location ?? undefined,
      latitude: event.latitude ?? null,
      longitude: event.longitude ?? null,
      isVirtual: event.isVirtual,
      virtualLink: event.virtualLink ?? undefined,
      capacity: event.capacity ?? undefined,
      price: event.price ? Number(event.price) : undefined,
      status: event.status,
      isFeatured: event.isFeatured,
      hasTransport: event.hasTransport,
      hasCertificate: event.hasCertificate ?? false,
      certificateTitle: event.certificateTitle ?? "",
      certificatePrice: event.certificatePrice ? Number(event.certificatePrice) : 0,
      holdMinutesCard: event.holdMinutesCard ?? 30,
      holdHoursManual: event.holdHoursManual ?? 24,
      nearEventWindowHours: event.nearEventWindowHours ?? 48,
      nearEventHoldMinutes: event.nearEventHoldMinutes ?? 15,
      salesCutoffHoursBefore: event.salesCutoffHoursBefore ?? undefined,
    };
  }

  return {
    status: "draft",
    isVirtual: false,
    isFeatured: false,
    hasTransport: false,
    hasCertificate: false,
    certificateTitle: "",
    certificatePrice: 0,
    price: undefined,
    latitude: null,
    longitude: null,
    holdMinutesCard: 30,
    holdHoursManual: 24,
    nearEventWindowHours: 48,
    nearEventHoldMinutes: 15,
  };
}
