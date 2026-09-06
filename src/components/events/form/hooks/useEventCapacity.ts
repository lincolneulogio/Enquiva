"use client";

import type { UseFormReturn } from "react-hook-form";
import type { CreateEventInput } from "@/lib/validations";

interface UseEventCapacityProps {
  form: UseFormReturn<CreateEventInput>;
  planMaxAttendees: number | null;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function useEventCapacity({ form, planMaxAttendees, t }: UseEventCapacityProps) {
  const clampCapacityInput = (raw: string) => {
    if (raw === "" || planMaxAttendees == null) return raw;
    const num = Number(raw);
    if (Number.isNaN(num)) return raw;
    if (num > planMaxAttendees) return String(planMaxAttendees);
    return raw;
  };

  const {
    onChange: onCapacityChange,
    onBlur: onCapacityBlur,
    ...capacityField
  } = form.register("capacity", {
    setValueAs: (value) => {
      if (value === "" || value === null || value === undefined) return null;
      const num = Number(value);
      if (Number.isNaN(num)) return null;
      if (planMaxAttendees != null && num > planMaxAttendees) return planMaxAttendees;
      return num;
    },
    validate: (value) => {
      if (planMaxAttendees == null || value == null) return true;
      if (value <= planMaxAttendees) return true;
      return t("events.form.validation.capacityPlanLimit", { max: planMaxAttendees });
    },
  });

  const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clamped = clampCapacityInput(e.target.value);
    if (clamped !== e.target.value) {
      e.target.value = clamped;
    }
    void onCapacityChange(e);
  };

  const handleCapacityBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const clamped = clampCapacityInput(e.target.value);
    if (clamped !== e.target.value) {
      e.target.value = clamped;
      const num = clamped === "" ? null : Number(clamped);
      form.setValue("capacity", Number.isNaN(num) ? null : num, { shouldValidate: true });
    }
    void onCapacityBlur(e);
  };

  return {
    capacityField,
    handleCapacityChange,
    handleCapacityBlur,
  };
}
