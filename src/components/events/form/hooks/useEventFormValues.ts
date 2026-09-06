"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEventSchema, type CreateEventInput } from "@/lib/validations";
import { EVENT_CATEGORIES, getTypesForCategory } from "@/lib/events/taxonomy";
import type { Event } from "@/lib/db/schema";
import {
  type CategoryOption,
  type PlanSummary,
  toLocalDateTimeInputValue,
  VALIDATION_MESSAGE_KEY_BY_TEXT,
} from "../types";
import { getEventFormDefaultValues } from "../event-form-defaults";
import { useEventCapacity } from "./useEventCapacity";

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

  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>(() =>
    buildCategoryOptions(categories),
  );
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
    highlightedField === field
      ? "border-destructive ring-2 ring-destructive/40 animate-pulse"
      : "";

  const defaultValues = getEventFormDefaultValues(event);

  const form = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues,
  });

  const { control, setValue, clearErrors } = form;

  const watchedCategory = useWatch({ control, name: "category" });
  const watchedType = useWatch({ control, name: "eventType" });
  const isVirtual = useWatch({ control, name: "isVirtual" });
  const hasTransport = useWatch({ control, name: "hasTransport" });
  const hasCertificate = useWatch({ control, name: "hasCertificate" });
  const watchedCertificatePrice = useWatch({ control, name: "certificatePrice" });
  const watchedPrice = useWatch({ control, name: "price" });
  const watchedTitle = useWatch({ control, name: "title" });
  const watchedLocation = useWatch({ control, name: "location" });
  const watchedLatitude = useWatch({ control, name: "latitude" });
  const watchedLongitude = useWatch({ control, name: "longitude" });
  const watchedDateTime = useWatch({ control, name: "date" });
  const watchedEndDate = useWatch({ control, name: "endDate" });
  const currentDescription = useWatch({ control, name: "description" });

  const suggestedTypes = watchedCategory ? getTypesForCategory(watchedCategory) : [];

  useEffect(() => {
    if (!watchedCategory) return;
    if (suggestedTypes.length > 0 && !suggestedTypes.some((item) => item.slug === watchedType)) {
      setValue("eventType", suggestedTypes[0].slug, { shouldValidate: true, shouldDirty: true });
    }
  }, [watchedCategory, suggestedTypes, watchedType, setValue]);

  useEffect(() => {
    if (!isVirtual) return;
    setValue("location", "", { shouldDirty: true });
    setValue("latitude", null, { shouldDirty: true });
    setValue("longitude", null, { shouldDirty: true });
    clearErrors(["location", "latitude", "longitude"]);
  }, [isVirtual, setValue, clearErrors]);

  const isPaidEvent = Boolean(watchedPrice != null && Number(watchedPrice) > 0);
  const hasPaidCertificate = Boolean(
    hasCertificate && watchedCertificatePrice != null && Number(watchedCertificatePrice) > 0,
  );
  const requiresPaymentMethods = isPaidEvent || hasPaidCertificate;

  const canUseTransport = Boolean(planSummary?.isUnlimited || planSummary?.features?.transport || event?.hasTransport);
  const canUseCulqi = Boolean(planSummary?.isUnlimited || planSummary?.features?.culqi);
  const canCreateEvent = Boolean(planSummary?.isUnlimited || planSummary?.canCreateEvent !== false);
  const planMaxAttendees =
    planSummary && !planSummary.isUnlimited ? planSummary.plan.maxAttendeesPerEvent : null;

  const { capacityField, handleCapacityChange, handleCapacityBlur } = useEventCapacity({
    form,
    planMaxAttendees,
    t,
  });

  return {
    form,
    categoryOptions,
    setCategoryOptions,
    suggestedTypes,
    minimumEventDate,
    isVirtual,
    highlightedField,
    setHighlightedField,
    highlightTimeoutRef,
    getFieldHighlightClass,
    getLocalizedValidationMessage,
    watchedTitle,
    watchedDateTime,
    watchedEndDate,
    watchedLocation,
    watchedLatitude,
    watchedLongitude,
    watchedPrice,
    currentDescription,
    hasTransport,
    hasCertificate,
    requiresPaymentMethods,
    canUseTransport,
    canUseCulqi,
    canCreateEvent,
    planMaxAttendees,
    capacityField,
    handleCapacityChange,
    handleCapacityBlur,
  };
}
