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
import { type ScheduleSlotState, FIRST_ERROR_FIELD_ORDER } from "../types";

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

    if (data.isFeatured && !canFeature) {
      toast.error(t("events.form.validation.featuredPlanRequired"));
      setFocus("isFeatured");
      setHighlightedField("isFeatured");
      return false;
    }

    if (selectablePaymentMethods.length > 0 && selectedPaymentMethodIds.length === 0) {
      toast.error(t("events.form.validation.paymentMethodRequired"));
      return false;
    }

    for (let i = 0; i < scheduleSlots.length; i++) {
      const slot = scheduleSlots[i];
      if (!slot.datePart || !slot.startTimePart) {
        toast.error(
          locale === "en"
            ? `Please specify date and start time for "${slot.label || `Schedule ${i + 1}`}"`
            : `Debes indicar fecha y hora de inicio para "${slot.label || `Horario ${i + 1}`}"`,
        );
        return false;
      }
      if (slot.endTimePart && slot.endTimePart <= slot.startTimePart) {
        toast.error(
          locale === "en"
            ? `End time must be after start time for "${slot.label || `Schedule ${i + 1}`}"`
            : `La hora de fin debe ser posterior a la hora de inicio en "${slot.label || `Horario ${i + 1}`}"`,
        );
        return false;
      }
    }

    return true;
  };

  const onSubmit = async (data: CreateEventInput) => {
    if (!validateCustomRules(data)) return;

    startTransition(async () => {
      try {
        const payload = {
          ...data,
          coverImage,
        };

        let result;
        if (event) {
          result = await updateEvent(event.id, payload);
          if (result.success && selectablePaymentMethods.length > 0) {
            await setEventPaymentMethods(event.id, selectedPaymentMethodIds);
          }
        } else {
          result = await createEvent(payload);
          if (result.success && "event" in result && result.event?.id && selectablePaymentMethods.length > 0) {
            await setEventPaymentMethods(result.event.id, selectedPaymentMethodIds);
          }
        }

        if (result.success) {
          toast.success(event ? t("events.form.updatedSuccess") : t("events.form.createdSuccess"));
          clearDraft();
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(extraDraftKey);
          }
          router.push(redirectPath);
          router.refresh();
        } else {
          const rawError = "error" in result && typeof result.error === "string" ? result.error : "";
          toast.error(getLocalizedValidationMessage(rawError));
        }
      } catch (err: any) {
        toast.error(getLocalizedValidationMessage(err?.message));
      }
    });
  };

  const onInvalid = (fieldErrors: any) => {
    const errorKeys = Object.keys(fieldErrors) as Array<keyof CreateEventInput>;
    if (errorKeys.length === 0) return;

    const firstField =
      FIRST_ERROR_FIELD_ORDER.find((field) => errorKeys.includes(field)) || errorKeys[0];
    const firstErrorMessage = fieldErrors[firstField]?.message as string | undefined;

    setFocus(firstField as any);
    setHighlightedField(firstField);

    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedField(null);
    }, 4500);

    toast.error(getLocalizedValidationMessage(firstErrorMessage));
  };

  return { isPending, onSubmit, onInvalid };
}
