"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { UseFormSetFocus } from "react-hook-form";
import type { CreateEventInput } from "@/lib/validations";
import type { Event } from "@/lib/db/schema";
import { createEvent, updateEvent } from "@/actions/events";
import { setEventPaymentMethods } from "@/actions/payment-methods";
import { saveFormDraft } from "@/lib/form-persistence";
import { type ScheduleSlotState, FIRST_ERROR_FIELD_ORDER } from "./types";

interface UseEventSubmitHandlerProps {
  event?: Event;
  planMaxAttendees?: number | null;
  canFeature?: boolean;
  selectablePaymentMethods: Array<{ id: string; type: string; label: string; holderName: string }>;
  selectedPaymentMethodIds: string[];
  scheduleSlots: ScheduleSlotState[];
  coverImage: string | null;
  extraDraftKey: string;
  clearDraft: () => void;
  redirectPath: string;
  locale: "es" | "en";
  t: (key: string, params?: Record<string, string | number>) => string;
  getLocalizedValidationMessage: (message?: string) => string;
  setFocus: UseFormSetFocus<CreateEventInput>;
  setHighlightedField: React.Dispatch<React.SetStateAction<keyof CreateEventInput | null>>;
  highlightTimeoutRef: React.MutableRefObject<number | null>;
}

export function useEventSubmitHandler({
  event,
  planMaxAttendees,
  canFeature,
  selectablePaymentMethods,
  selectedPaymentMethodIds,
  scheduleSlots,
  coverImage,
  extraDraftKey,
  clearDraft,
  redirectPath,
  locale,
  t,
  getLocalizedValidationMessage,
  setFocus,
  setHighlightedField,
  highlightTimeoutRef,
}: UseEventSubmitHandlerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const validateCustomRules = (data: CreateEventInput): boolean => {
    if (planMaxAttendees != null && !data.isVirtual && data.capacity != null && data.capacity > planMaxAttendees) {
      toast.error(t("events.form.validation.capacityPlanLimit", { max: planMaxAttendees }));
      setFocus("capacity");
      setHighlightedField("capacity");
      return false;
    }

    if (!data.isVirtual && data.status === "published" && (data.latitude == null || data.longitude == null)) {
      toast.error(t("events.form.validation.mapPinRequired"));
      setHighlightedField("location");
      document.getElementById("event-location")?.focus();
      return false;
    }

    const isPaid = Boolean(data.price != null && Number(data.price) > 0);
    const hasPaidCert = Boolean(data.hasCertificate && data.certificatePrice != null && Number(data.certificatePrice) > 0);
    if (isPaid || hasPaidCert) {
      if (selectablePaymentMethods.length === 0) {
        toast.error(
          locale === "en"
            ? "You have not configured any payment methods in your organizer settings. Please configure one in Settings > Payment Methods before publishing."
            : "No has configurado ningún medio de pago en tu panel. Debes activar al menos uno en Configuración > Medios de pago para poder cobrar por el evento o certificaciones.",
        );
        return false;
      }
      if (selectedPaymentMethodIds.length === 0) {
        toast.error(
          locale === "en"
            ? "Please select at least one payment method for this event."
            : "Debes seleccionar al menos un medio de pago obligatorio para este evento.",
        );
        document.getElementById("event-payment-methods-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
      }
    }

    for (let i = 1; i < scheduleSlots.length; i++) {
      const slot = scheduleSlots[i];
      if (!slot.datePart || !slot.startTimePart) {
        toast.error(
          locale === "en"
            ? `Please complete date and start time for ${slot.label || `Schedule ${i + 1}`}`
            : `Por favor completa la fecha y hora de inicio para el ${slot.label || `Horario ${i + 1}`}`,
        );
        const missingId = !slot.datePart ? `event-slot-${slot.id}-date` : `event-slot-${slot.id}-start`;
        document.getElementById(missingId)?.focus();
        return false;
      }
    }

    return true;
  };

  const onSubmit = (data: CreateEventInput) => {
    if (!validateCustomRules(data)) return;

    startTransition(async () => {
      try {
        const payload = {
          ...data,
          coverImage,
          capacity: data.isVirtual ? null : data.capacity,
          location: data.isVirtual ? null : data.location,
          latitude: data.isVirtual ? null : data.latitude,
          longitude: data.isVirtual ? null : data.longitude,
          virtualLink: data.isVirtual ? data.virtualLink : null,
          isFeatured: canFeature ? data.isFeatured : false,
          status: data.status ?? "draft",
          hasTransport: data.hasTransport ?? false,
        };

        const result = event ? await updateEvent(event.id, payload) : await createEvent(payload);

        if (result.success) {
          const savedEventId = event?.id ?? result.event?.id;
          if (savedEventId) {
            await setEventPaymentMethods(savedEventId, selectedPaymentMethodIds);
          }

          clearDraft();
          if (!event) {
            saveFormDraft(extraDraftKey, { coverImage: null, selectedPaymentMethodIds: [] });
          }

          toast.success(event ? t("events.form.eventUpdated") : t("events.form.eventCreated"));
          router.push(redirectPath);
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? getLocalizedValidationMessage(err.message) : t("events.form.genericError"),
        );
      }
    });
  };

  const onInvalid = (errs: any) => {
    const firstFieldWithError = FIRST_ERROR_FIELD_ORDER.find((field) => !!errs[field]);
    if (firstFieldWithError) {
      if (firstFieldWithError === "date") {
        const primarySlot = scheduleSlots[0];
        const dateInputId = primarySlot?.datePart
          ? `event-slot-${primarySlot.id}-start`
          : `event-slot-${primarySlot?.id ?? "slot-1"}-date`;
        document.getElementById(dateInputId)?.focus();
      } else {
        setFocus(firstFieldWithError);
      }
      setHighlightedField(firstFieldWithError);
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightedField(null);
      }, 1400);

      const fieldElement =
        firstFieldWithError === "date"
          ? document.getElementById(`event-slot-${scheduleSlots[0]?.id ?? "slot-1"}-date`)
          : document.querySelector<HTMLElement>(`[name="${firstFieldWithError}"]`);
      fieldElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const first = Object.values(errs).find(
      (e): e is { message?: string } => typeof e === "object" && e !== null && "message" in e,
    );
    toast.error(getLocalizedValidationMessage(first?.message), { id: "event-form-validation" });
  };

  return { isPending, onSubmit, onInvalid };
}
