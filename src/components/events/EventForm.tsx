"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { useState } from "react";

import { type EventFormProps, EVENT_DRAFT_STORAGE_KEY } from "./form/types";
import { MediaSettingsSection } from "./form/MediaSettingsSection";
import { EventFormBanner } from "./form/EventFormBanner";
import { EventFormLeftColumn } from "./form/EventFormLeftColumn";
import { useEventFormValues } from "./form/useEventFormValues";
import { useEventScheduleSlots } from "./form/useEventScheduleSlots";
import { useEventPaymentAndRoutes } from "./form/useEventPaymentAndRoutes";
import { useEventSubmitHandler } from "./form/useEventSubmitHandler";

const COVER_DROPZONE_APPEARANCE = {
  container:
    "h-48 w-full rounded-xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/5 via-muted/10 to-transparent p-4 transition-all duration-300 hover:border-primary/40 hover:from-primary/10 hover:shadow-sm cursor-pointer",
  uploadIcon: "h-7 w-7 text-primary/70 transition-transform duration-300 hover:scale-110",
  label: "text-xs font-semibold text-foreground tracking-wide mt-1.5",
  allowedContent: "text-[10px] text-muted-foreground/80 mt-0.5 font-medium",
  button:
    "mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/15 transition-all duration-300 hover:bg-primary/95 hover:shadow-lg hover:shadow-primary/25 active:scale-95",
};

export function EventForm({
  event,
  redirectPath = "/organizer",
  categories,
  canFeature = false,
  planSummary,
}: EventFormProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [coverImage, setCoverImage] = useState<string | null>(event?.coverImage ?? null);

  const formValues = useEventFormValues({ event, categories, planSummary, locale, t });
  const { form, setHighlightedField, highlightTimeoutRef, getFieldHighlightClass, getLocalizedValidationMessage } = formValues;
  const { register, handleSubmit, setValue, setFocus, clearErrors, trigger, formState: { errors } } = form;

  const {
    scheduleSlots,
    handleSlotFieldChange,
    handleAddScheduleSlot,
    handleRemoveScheduleSlot,
    handleCopyDateFromPrimary,
  } = useEventScheduleSlots({
    event,
    setValue,
    trigger,
    clearErrors,
    watchedDateTime: formValues.watchedDateTime,
    locale,
    setHighlightedField,
  });

  const eventDraftKey = event ? formStorageKey(`event.edit.${event.id}`) : EVENT_DRAFT_STORAGE_KEY;
  const { clearDraft } = useFormPersistence(eventDraftKey, form);
  const extraDraftKey = `${eventDraftKey}.extra`;

  const {
    selectablePaymentMethods,
    selectedPaymentMethodIds,
    setSelectedPaymentMethodIds,
    routes,
    loadingRoutes,
  } = useEventPaymentAndRoutes({
    event,
    hasTransport: formValues.hasTransport,
    requiresPaymentMethods: formValues.requiresPaymentMethods,
    canUseCulqi: formValues.canUseCulqi,
    extraDraftKey,
    setCoverImage,
    coverImage,
  });

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) window.clearTimeout(highlightTimeoutRef.current);
    };
  }, [highlightTimeoutRef]);

  useEffect(() => {
    if (!formValues.highlightedField || errors[formValues.highlightedField]) return;
    setHighlightedField(null);
    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }
  }, [formValues.highlightedField, errors, setHighlightedField, highlightTimeoutRef]);

  useEffect(() => {
    if (Object.keys(errors).length === 0) toast.dismiss("event-form-validation");
  }, [errors]);

  const { isPending, onSubmit, onInvalid } = useEventSubmitHandler({
    event,
    planMaxAttendees: formValues.planMaxAttendees,
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
  });

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8" translate="no" data-gramm="false">
      <EventFormBanner
        planSummary={planSummary}
        canCreateEvent={formValues.canCreateEvent}
        isExistingEvent={Boolean(event)}
        t={t}
      />

      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <EventFormLeftColumn
          register={register}
          errors={errors}
          setValue={setValue}
          currentDescription={formValues.currentDescription}
          categoryOptions={formValues.categoryOptions}
          suggestedTypes={formValues.suggestedTypes}
          locale={locale}
          getFieldHighlightClass={getFieldHighlightClass}
          getLocalizedValidationMessage={getLocalizedValidationMessage}
          t={t}
          scheduleSlots={scheduleSlots}
          minimumEventDate={formValues.minimumEventDate}
          handleAddScheduleSlot={handleAddScheduleSlot}
          handleRemoveScheduleSlot={handleRemoveScheduleSlot}
          handleCopyDateFromPrimary={handleCopyDateFromPrimary}
          handleSlotFieldChange={handleSlotFieldChange}
          isVirtual={formValues.isVirtual}
          watchedLocation={formValues.watchedLocation ?? undefined}
          watchedLatitude={typeof formValues.watchedLatitude === "number" ? formValues.watchedLatitude : null}
          watchedLongitude={typeof formValues.watchedLongitude === "number" ? formValues.watchedLongitude : null}
          planMaxAttendees={formValues.planMaxAttendees}
          capacityField={formValues.capacityField}
          handleCapacityChange={formValues.handleCapacityChange}
          handleCapacityBlur={formValues.handleCapacityBlur}
          watchedPrice={typeof formValues.watchedPrice === "number" ? formValues.watchedPrice : undefined}
          selectablePaymentMethods={selectablePaymentMethods}
          requiresPaymentMethods={formValues.requiresPaymentMethods}
          selectedPaymentMethodIds={selectedPaymentMethodIds}
          setSelectedPaymentMethodIds={setSelectedPaymentMethodIds}
          hasTransport={formValues.hasTransport}
          event={event}
          loadingRoutes={loadingRoutes}
          routes={routes}
          watchedTitle={formValues.watchedTitle}
          watchedDateTime={formValues.watchedDateTime}
          watchedEndDate={formValues.watchedEndDate ?? undefined}
        />

        <MediaSettingsSection
          coverImage={coverImage}
          setCoverImage={setCoverImage}
          coverDropzoneAppearance={COVER_DROPZONE_APPEARANCE}
          register={register}
          errors={errors}
          canFeature={canFeature}
          canUseTransport={Boolean(formValues.canUseTransport)}
          hasTransport={formValues.hasTransport}
          hasCertificate={formValues.hasCertificate}
          isPending={isPending}
          event={event}
          canCreateEvent={formValues.canCreateEvent}
          getFieldHighlightClass={getFieldHighlightClass}
          getLocalizedValidationMessage={getLocalizedValidationMessage}
          locale={locale}
          t={t}
        />
      </div>
    </form>
  );
}
