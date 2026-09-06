"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import type { UseFormSetValue, UseFormTrigger, UseFormClearErrors } from "react-hook-form";
import type { CreateEventInput, EventScheduleSlot } from "@/lib/validations";
import type { Event } from "@/lib/db/schema";
import { type ScheduleSlotState, toLocalDateTimeInputValue } from "../types";
import { detectShiftFromTime, isGenericShiftLabel } from "@/lib/events/schedule-utils";

interface UseEventScheduleSlotsProps {
  event?: Event;
  setValue: UseFormSetValue<CreateEventInput>;
  trigger: UseFormTrigger<CreateEventInput>;
  clearErrors: UseFormClearErrors<CreateEventInput>;
  watchedDateTime?: string;
  locale: "es" | "en";
  setHighlightedField: React.Dispatch<React.SetStateAction<keyof CreateEventInput | null>>;
}

export function useEventScheduleSlots({
  event,
  setValue,
  trigger,
  clearErrors,
  watchedDateTime,
  locale,
  setHighlightedField,
}: UseEventScheduleSlotsProps) {
  const buildInitialSlots = (): ScheduleSlotState[] => {
    if (event?.schedules && event.schedules.length > 0) {
      return event.schedules.slice(0, 3).map((s, idx) => {
        const sDate = s.date ? toLocalDateTimeInputValue(s.date) : "";
        const sEndDate = s.endDate ? toLocalDateTimeInputValue(s.endDate) : "";
        const startTimePart = sDate.slice(11, 16);
        const shift = startTimePart ? detectShiftFromTime(startTimePart, locale) : null;
        return {
          id: s.id || `slot-${idx + 1}`,
          label: s.label || shift?.label || (idx === 0 ? "Horario Principal" : `Horario ${idx + 1}`),
          datePart: sDate.slice(0, 10),
          startTimePart,
          endTimePart: sEndDate ? sEndDate.slice(11, 16) : "",
        };
      });
    }
    const initialDateStr = event?.date ? toLocalDateTimeInputValue(event.date) : "";
    const initialEndDateStr = event?.endDate ? toLocalDateTimeInputValue(event.endDate) : "";
    const initialStartTime = initialDateStr.slice(11, 16);
    const initialShift = initialStartTime ? detectShiftFromTime(initialStartTime, locale) : null;
    return [
      {
        id: "slot-1",
        label: initialShift?.label || (locale === "en" ? "Main Schedule" : "Horario Principal"),
        datePart: initialDateStr.slice(0, 10),
        startTimePart: initialStartTime,
        endTimePart: initialEndDateStr ? initialEndDateStr.slice(11, 16) : "",
      },
    ];
  };

  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlotState[]>(buildInitialSlots);
  const datePartsUpdateRef = useRef(false);

  useEffect(() => {
    if (datePartsUpdateRef.current) {
      datePartsUpdateRef.current = false;
      return;
    }
    if (!watchedDateTime) return;
    const nextDate = watchedDateTime.slice(0, 10);
    const nextTime = watchedDateTime.slice(11, 16);

    setScheduleSlots((prev) => {
      if (prev.length === 0) return prev;
      if (prev[0].datePart === nextDate && prev[0].startTimePart === nextTime) {
        return prev;
      }
      return prev.map((item, idx) => {
        if (idx !== 0) return item;
        const nextItem = { ...item, datePart: nextDate, startTimePart: nextTime };
        if (isGenericShiftLabel(item.label) && nextTime) {
          nextItem.label = detectShiftFromTime(nextTime, locale).label;
        }
        return nextItem;
      });
    });
  }, [watchedDateTime, locale]);

  const syncSlotsToForm = (slots: ScheduleSlotState[]) => {
    const slot1 = slots[0];
    const combinedPrimaryDate =
      slot1 && slot1.datePart && slot1.startTimePart ? `${slot1.datePart}T${slot1.startTimePart}` : "";
    const combinedPrimaryEndDate =
      slot1 && slot1.datePart && slot1.endTimePart ? `${slot1.datePart}T${slot1.endTimePart}` : null;

    datePartsUpdateRef.current = true;
    setValue("date", combinedPrimaryDate, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: Boolean(combinedPrimaryDate),
    });
    setValue("endDate", combinedPrimaryEndDate ?? undefined, {
      shouldDirty: true,
    });

    const schedulesPayload: EventScheduleSlot[] = slots.map((s, idx) => {
      const sDate = s.datePart && s.startTimePart ? `${s.datePart}T${s.startTimePart}` : "";
      const sEndDate = s.datePart && s.endTimePart ? `${s.datePart}T${s.endTimePart}` : null;
      const detected = s.startTimePart ? detectShiftFromTime(s.startTimePart, locale).label : null;
      return {
        id: s.id,
        label: s.label.trim() || detected || (idx === 0 ? "Horario Principal" : `Horario ${idx + 1}`),
        date: sDate,
        endDate: sEndDate,
      };
    });

    setValue("schedules", schedulesPayload, { shouldDirty: true });

    if (combinedPrimaryDate) {
      void trigger("date").then((valid) => {
        if (!valid) return;
        clearErrors("date");
        setHighlightedField((current) => (current === "date" ? null : current));
        toast.dismiss("event-form-validation");
      });
    }
  };

  const handleSlotFieldChange = (
    index: number,
    field: "label" | "datePart" | "startTimePart" | "endTimePart",
    value: string,
  ) => {
    setScheduleSlots((prev) => {
      const updated = prev.map((item, idx) => {
        if (idx !== index) return item;
        const nextItem = { ...item, [field]: value };
        // Si el usuario cambia la hora de inicio y no ha escrito un nombre personalizado,
        // actualizamos la etiqueta automáticamente al turno correspondiente (Mañana, Tarde o Noche).
        if (field === "startTimePart" && isGenericShiftLabel(item.label) && value) {
          nextItem.label = detectShiftFromTime(value, locale).label;
        }
        return nextItem;
      });
      syncSlotsToForm(updated);
      return updated;
    });
  };

  const handleAddScheduleSlot = () => {
    if (scheduleSlots.length >= 3) return;
    const nextIndex = scheduleSlots.length + 1;
    const defaultDate = scheduleSlots[0]?.datePart || "";
    const newSlot: ScheduleSlotState = {
      id: `slot-${Date.now()}`,
      label: locale === "en" ? `Schedule ${nextIndex}` : `Horario ${nextIndex}`,
      datePart: defaultDate,
      startTimePart: "",
      endTimePart: "",
    };
    const updated = [...scheduleSlots, newSlot];
    syncSlotsToForm(updated);
    setScheduleSlots(updated);
    toast.info(locale === "en" ? `Schedule ${nextIndex} added` : `Horario ${nextIndex} agregado`);
  };

  const handleRemoveScheduleSlot = (index: number) => {
    if (index === 0) return;
    const updated = scheduleSlots.filter((_, idx) => idx !== index);
    syncSlotsToForm(updated);
    setScheduleSlots(updated);
    toast.info(locale === "en" ? "Schedule removed" : "Horario eliminado");
  };

  const handleCopyDateFromPrimary = (index: number) => {
    const primaryDate = scheduleSlots[0]?.datePart;
    if (!primaryDate) return;
    handleSlotFieldChange(index, "datePart", primaryDate);
  };

  return {
    scheduleSlots,
    setScheduleSlots,
    syncScheduleSlotsToForm: syncSlotsToForm,
    handleSlotFieldChange,
    handleAddScheduleSlot,
    handleRemoveScheduleSlot,
    handleCopyDateFromPrimary,
  };
}
