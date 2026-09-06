import type { Event } from "@/lib/db/schema";
import type { getOrganizerPlanSummary } from "@/lib/billing/enforce";
import type { CreateEventInput } from "@/lib/validations";
import { formStorageKey } from "@/lib/form-persistence";

export type PlanSummary = Awaited<ReturnType<typeof getOrganizerPlanSummary>>;

export interface CategoryOption {
    slug: string;
    label: string;
    colorClass: string;
}

export interface EventFormProps {
    event?: Event;
    redirectPath?: string;
    categories: CategoryOption[];
    canFeature?: boolean;
    planSummary?: PlanSummary;
    initialEventTypes?: Array<{ slug: string; label: string; categorySlug: string }>;
}

export interface ScheduleSlotState {
    id: string;
    label: string;
    datePart: string;
    startTimePart: string;
    endTimePart: string;
}

export type EventFormDraft = {
    coverImage: string | null;
    selectedPaymentMethodIds: string[];
};

export const EVENT_DRAFT_STORAGE_KEY = formStorageKey("event.create");

export const EVENT_HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) =>
    String(index + 1).padStart(2, "0"),
);

export const EVENT_MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) =>
    String(index * 5).padStart(2, "0"),
);

export function toLocalDateTimeInputValue(value: Date | string) {
    const date = new Date(value);
    const pad = (part: number) => String(part).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function openNativePicker(input: HTMLInputElement | null) {
    if (!input) return;
    try {
        input.showPicker();
    } catch {
        input.focus();
        input.click();
    }
}

export function to24HourTime(hour12: string, minute: string, period: "AM" | "PM") {
    const parsedHour = Number(hour12);
    const hour24 =
        period === "PM"
            ? (parsedHour % 12) + 12
            : parsedHour % 12;
    return `${String(hour24).padStart(2, "0")}:${minute}`;
}

export const VALIDATION_MESSAGE_KEY_BY_TEXT: Record<string, string> = {
    "Title must be at least 3 characters": "events.form.validation.titleMin",
    "Description must be at least 20 characters": "events.form.validation.descriptionMin",
    "Category is required": "events.form.validation.categoryRequired",
    "Date is required": "events.form.validation.dateRequired",
    "Invalid date format": "events.form.validation.dateInvalid",
    "Event date cannot be in the past": "events.form.validation.datePast",
    "Meeting link is required for virtual events": "events.form.validation.virtualLinkRequired",
    "Venue address is required for in-person events": "events.form.validation.locationRequired",
    "Map pin is required to publish an in-person event": "events.form.validation.mapPinRequired",
    "Invalid url": "events.form.validation.invalidUrl",
    "Expected number, received nan": "events.form.validation.capacityInvalid",
    "Expected number, received string": "events.form.validation.capacityInvalid",
    "Number must be greater than 0": "events.form.validation.capacityInvalid",
    "Required": "events.form.validation.required",
};

export const FIRST_ERROR_FIELD_ORDER: Array<keyof CreateEventInput> = [
    "title",
    "description",
    "category",
    "date",
    "virtualLink",
    "location",
    "latitude",
    "capacity",
    "status",
];
