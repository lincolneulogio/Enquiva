"use client";

import React from "react";
import type { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import type { CreateEventInput } from "@/lib/validations";
import type { Event } from "@/lib/db/schema";
import type { CategoryOption, ScheduleSlotState } from "./types";
import { BasicInfoSection } from "./BasicInfoSection";
import { ScheduleSection } from "./ScheduleSection";
import { LocationSection } from "./LocationSection";
import { PricingPaymentsSection } from "./PricingPaymentsSection";
import { TransportSection } from "./TransportSection";
import type { getRoutesByEvent } from "@/actions/transport";

type TransportRouteList = Awaited<ReturnType<typeof getRoutesByEvent>>;

interface EventFormLeftColumnProps {
  register: UseFormRegister<CreateEventInput>;
  errors: FieldErrors<CreateEventInput>;
  setValue: UseFormSetValue<CreateEventInput>;
  currentDescription?: string;
  categoryOptions: CategoryOption[];
  suggestedTypes: Array<{ slug: string; label: string }>;
  locale: "es" | "en";
  getFieldHighlightClass: (field: keyof CreateEventInput) => string;
  getLocalizedValidationMessage: (message?: string) => string;
  t: (key: string, params?: Record<string, string | number>) => string;
  scheduleSlots: ScheduleSlotState[];
  minimumEventDate: string;
  handleAddScheduleSlot: () => void;
  handleRemoveScheduleSlot: (index: number) => void;
  handleCopyDateFromPrimary: (index: number) => void;
  handleSlotFieldChange: (index: number, field: "label" | "datePart" | "startTimePart" | "endTimePart", val: string) => void;
  isVirtual?: boolean;
  watchedLocation?: string;
  watchedLatitude: number | null;
  watchedLongitude: number | null;
  planMaxAttendees?: number | null;
  capacityField: any;
  handleCapacityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCapacityBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  watchedPrice?: number;
  selectablePaymentMethods: Array<{ id: string; type: string; label: string; holderName: string }>;
  requiresPaymentMethods: boolean;
  selectedPaymentMethodIds: string[];
  setSelectedPaymentMethodIds: React.Dispatch<React.SetStateAction<string[]>>;
  hasTransport?: boolean;
  event?: Event;
  loadingRoutes: boolean;
  routes: TransportRouteList;
  watchedTitle?: string;
  watchedDateTime?: string;
  watchedEndDate?: string;
}

export function EventFormLeftColumn({
  register,
  errors,
  setValue,
  currentDescription,
  categoryOptions,
  suggestedTypes,
  locale,
  getFieldHighlightClass,
  getLocalizedValidationMessage,
  t,
  scheduleSlots,
  minimumEventDate,
  handleAddScheduleSlot,
  handleRemoveScheduleSlot,
  handleCopyDateFromPrimary,
  handleSlotFieldChange,
  isVirtual,
  watchedLocation,
  watchedLatitude,
  watchedLongitude,
  planMaxAttendees,
  capacityField,
  handleCapacityChange,
  handleCapacityBlur,
  watchedPrice,
  selectablePaymentMethods,
  requiresPaymentMethods,
  selectedPaymentMethodIds,
  setSelectedPaymentMethodIds,
  hasTransport,
  event,
  loadingRoutes,
  routes,
  watchedTitle,
  watchedDateTime,
  watchedEndDate,
}: EventFormLeftColumnProps) {
  return (
    <div className="space-y-6 lg:col-span-2">
      <BasicInfoSection
        register={register}
        errors={errors}
        setValue={setValue}
        currentDescription={currentDescription}
        categoryOptions={categoryOptions}
        suggestedTypes={suggestedTypes}
        locale={locale}
        getFieldHighlightClass={getFieldHighlightClass}
        getLocalizedValidationMessage={getLocalizedValidationMessage}
        t={t}
      />

      <ScheduleSection
        scheduleSlots={scheduleSlots}
        minimumEventDate={minimumEventDate}
        locale={locale}
        handleAddScheduleSlot={handleAddScheduleSlot}
        handleRemoveScheduleSlot={handleRemoveScheduleSlot}
        handleCopyDateFromPrimary={handleCopyDateFromPrimary}
        handleSlotFieldChange={handleSlotFieldChange}
        errors={errors}
        getFieldHighlightClass={getFieldHighlightClass}
        getLocalizedValidationMessage={getLocalizedValidationMessage}
      />

      <LocationSection
        isVirtual={isVirtual}
        register={register}
        errors={errors}
        watchedLocation={watchedLocation}
        watchedLatitude={watchedLatitude}
        watchedLongitude={watchedLongitude}
        setValue={setValue}
        planMaxAttendees={planMaxAttendees}
        getFieldHighlightClass={getFieldHighlightClass}
        getLocalizedValidationMessage={getLocalizedValidationMessage}
        t={t}
      />

      <PricingPaymentsSection
        isVirtual={isVirtual}
        register={register}
        errors={errors}
        capacityField={capacityField}
        handleCapacityChange={handleCapacityChange}
        handleCapacityBlur={handleCapacityBlur}
        planMaxAttendees={planMaxAttendees}
        watchedPrice={watchedPrice}
        selectablePaymentMethods={selectablePaymentMethods}
        requiresPaymentMethods={requiresPaymentMethods}
        selectedPaymentMethodIds={selectedPaymentMethodIds}
        setSelectedPaymentMethodIds={setSelectedPaymentMethodIds}
        getFieldHighlightClass={getFieldHighlightClass}
        getLocalizedValidationMessage={getLocalizedValidationMessage}
        t={t}
      />

      <TransportSection
        hasTransport={hasTransport}
        event={event}
        loadingRoutes={loadingRoutes}
        routes={routes}
        watchedTitle={watchedTitle}
        watchedDateTime={watchedDateTime}
        watchedEndDate={watchedEndDate}
        watchedLocation={watchedLocation}
        isVirtual={isVirtual}
        watchedLatitude={watchedLatitude}
        watchedLongitude={watchedLongitude}
      />
    </div>
  );
}
