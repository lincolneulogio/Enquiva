"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEventSchema, type CreateEventInput } from "@/lib/validations";
import { EVENT_CATEGORIES, getTypesForCategory } from "@/lib/events/taxonomy";
import type { Event } from "@/lib/db/schema";
import { type CategoryOption, type PlanSummary, toLocalDateTimeInputValue, VALIDATION_MESSAGE_KEY_BY_TEXT } from "./types";
import { getEventFormDefaultValues } from "./event-form-defaults";

interface UseEventFormValuesProps {
  event?: Event;
  categories: CategoryOption[];
  planSummary?: PlanSummary;
  locale: "es" | "en";
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function useEventFormValues({
  event,
  categories,
  planSummary,
  locale,
  t,
}: UseEventFormValuesProps) {
  const [highlightedField, setHighlightedField] = useState<keyof CreateEventInput | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);

  const buildCategoryOptions = (customCats: CategoryOption[]): CategoryOption[] => {
    const standard: CategoryOption[] = EVENT_CATEGORIES.map((cat) => ({
      slug: cat.slug,
      label: locale === "en" ? cat.labelEn : cat.labelEs,
      colorClass: cat.colorClass,
    }));
    const combined = [...standard];
    customCats.forEach((c) => {
      if (!combined.some((item) => item.slug === c.slug)) combined.push(c);
    });
    return combined;
  };

  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>(() => buildCategoryOptions(categories));
  const [minimumEventDate, setMinimumEventDate] = useState("");

  useEffect(() => {
    setCategoryOptions(buildCategoryOptions(categories));
  }, [categories]);

  useEffect(() => {
    setMinimumEventDate(toLocalDateTimeInputValue(new Date()).slice(0, 10));
  }, []);

  const getLocalizedValidationMessage = (message?: string) => {
    if (!message) return t("events.form.requiredFieldsError");
    const key = VALIDATION_MESSAGE_KEY_BY_TEXT[message];
    return key ? t(key) : message;
  };

  const getFieldHighlightClass = (field: keyof CreateEventInput) =>
    highlightedField === field ? "border-destructive ring-2 ring-destructive/40 animate-pulse" : "";

  const form = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: getEventFormDefaultValues(event),
  });

  const { register, control, setValue, formState: { errors } } = form;

  const watchedDateTime = useWatch({ control, name: "date" });
  const watchedCategory = useWatch({ control, name: "category" });
  const suggestedTypes = watchedCategory ? getTypesForCategory(watchedCategory) : [];
  const isVirtual = useWatch({ control, name: "isVirtual" });
  const hasTransport = useWatch({ control, name: "hasTransport" });
  const hasCertificate = useWatch({ control, name: "hasCertificate" });
  const watchedCertificatePrice = useWatch({ control, name: "certificatePrice" });
  const watchedPrice = useWatch({ control, name: "price" });
  const watchedTitle = useWatch({ control, name: "title" });
  const watchedLocation = useWatch({ control, name: "location" });
  const watchedLatitude = useWatch({ control, name: "latitude" });
  const watchedLongitude = useWatch({ control, name: "longitude" });
  const watchedEndDate = useWatch({ control, name: "endDate" });
  const currentDescription = useWatch({ control, name: "description" });

  const isPaidEvent = Boolean(watchedPrice != null && Number(watchedPrice) > 0);
  const hasPaidCertificate = Boolean(hasCertificate && watchedCertificatePrice != null && Number(watchedCertificatePrice) > 0);
  const requiresPaymentMethods = isPaidEvent || hasPaidCertificate;

  useEffect(() => {
    if (!isVirtual) return;
    setValue("latitude", null, { shouldDirty: true });
    setValue("longitude", null, { shouldDirty: true });
  }, [isVirtual, setValue]);

  const canUseTransport = planSummary?.isUnlimited || planSummary?.features.transport || event?.hasTransport;
  const canUseCulqi = planSummary?.isUnlimited || planSummary?.features.culqi;
  const canCreateEvent = planSummary?.isUnlimited || planSummary?.canCreateEvent !== false;
  const planMaxAttendees = planSummary && !planSummary.isUnlimited ? planSummary.plan.maxAttendeesPerEvent : null;

  const clampCapacity = (raw: string) => {
    if (raw === "" || planMaxAttendees == null) return raw;
    const num = Number(raw);
    return Number.isNaN(num) ? raw : num > planMaxAttendees ? String(planMaxAttendees) : raw;
  };

  const { onChange: onCapacityChange, onBlur: onCapacityBlur, ...capacityField } = register("capacity", {
    setValueAs: (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const num = Number(val);
      if (Number.isNaN(num)) return null;
      return planMaxAttendees != null && num > planMaxAttendees ? planMaxAttendees : num;
    },
    validate: (val) => {
      if (planMaxAttendees == null || val == null) return true;
      return val <= planMaxAttendees ? true : t("events.form.validation.capacityPlanLimit", { max: planMaxAttendees });
    },
  });

  const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clamped = clampCapacity(e.target.value);
    if (clamped !== e.target.value) e.target.value = clamped;
    void onCapacityChange(e);
  };

  const handleCapacityBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const clamped = clampCapacity(e.target.value);
    if (clamped !== e.target.value) {
      e.target.value = clamped;
      const num = clamped === "" ? null : Number(clamped);
      setValue("capacity", Number.isNaN(num) ? null : num, { shouldValidate: true });
    }
    void onCapacityBlur(e);
  };

  useEffect(() => {
    if (planMaxAttendees == null || isVirtual) return;
    const current = form.getValues("capacity");
    if (current != null && current > planMaxAttendees) {
      setValue("capacity", planMaxAttendees, { shouldValidate: true });
    }
  }, [planMaxAttendees, isVirtual, form, setValue]);

  return {
    form,
    highlightedField,
    setHighlightedField,
    highlightTimeoutRef,
    categoryOptions,
    minimumEventDate,
    suggestedTypes,
    watchedDateTime,
    watchedCategory,
    isVirtual,
    hasTransport,
    hasCertificate,
    watchedPrice,
    watchedTitle,
    watchedLocation,
    watchedLatitude,
    watchedLongitude,
    watchedEndDate,
    currentDescription,
    requiresPaymentMethods,
    canUseTransport,
    canUseCulqi,
    canCreateEvent,
    planMaxAttendees,
    capacityField,
    handleCapacityChange,
    handleCapacityBlur,
    getFieldHighlightClass,
    getLocalizedValidationMessage,
  };
}
