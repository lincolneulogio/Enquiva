"use client";

import React from "react";
import { Video } from "lucide-react";
import type { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import type { CreateEventInput } from "@/lib/validations";
import { VenueAddressAutocomplete } from "@/components/events/VenueAddressAutocomplete";
import { EventLocationPickerDynamic } from "@/components/events/EventLocationMapDynamic";
import type { LatLng } from "@/lib/geo";
import type { PlaceSuggestion } from "@/lib/geo/nominatim";

interface LocationSectionProps {
  isVirtual?: boolean;
  register: UseFormRegister<CreateEventInput>;
  errors: FieldErrors<CreateEventInput>;
  watchedLocation?: string;
  watchedLatitude?: number | null;
  watchedLongitude?: number | null;
  setValue: UseFormSetValue<CreateEventInput>;
  planMaxAttendees?: number | null;
  getFieldHighlightClass: (field: keyof CreateEventInput) => string;
  getLocalizedValidationMessage: (message?: string) => string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function LocationSection({
  isVirtual,
  register,
  errors,
  watchedLocation,
  watchedLatitude,
  watchedLongitude,
  setValue,
  planMaxAttendees,
  getFieldHighlightClass,
  getLocalizedValidationMessage,
  t,
}: LocationSectionProps) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5 transition-all">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3.5">
        <div>
          <label
            htmlFor={isVirtual ? "event-virtual-link" : "event-location"}
            className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
          >
            {isVirtual ? t("events.form.meetingLink") : t("events.form.venueAddress")}{" "}
            <span className="text-destructive">*</span>
          </label>
        </div>

        <label
          htmlFor="event-virtual-toggle"
          className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-semibold text-foreground/80 cursor-pointer hover:border-primary/40 hover:text-foreground transition-all shadow-2xs"
        >
          <input
            id="event-virtual-toggle"
            type="checkbox"
            {...register("isVirtual")}
            className="rounded border-border text-primary focus:ring-primary/20"
          />
          <Video className="h-3.5 w-3.5 text-primary" />
          <span>{t("events.form.virtualEvent")}</span>
        </label>
      </div>

      {isVirtual ? (
        <div key="virtual-fields" className="space-y-1.5">
          <input
            id="event-virtual-link"
            {...register("virtualLink")}
            aria-invalid={Boolean(errors.virtualLink)}
            aria-describedby={errors.virtualLink ? "event-virtual-link-error" : undefined}
            placeholder={t("events.form.meetingLinkPlaceholder")}
            className={`w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${getFieldHighlightClass("virtualLink")}`}
          />
          {errors.virtualLink && (
            <p id="event-virtual-link-error" role="alert" className="mt-1 text-xs text-destructive">
              {getLocalizedValidationMessage(errors.virtualLink.message)}
            </p>
          )}
        </div>
      ) : (
        <div key="physical-fields" className="space-y-4">
          <div className="space-y-1.5">
            <VenueAddressAutocomplete
              id="event-location"
              value={watchedLocation || ""}
              onChange={(text: string) => {
                setValue("location", text, { shouldDirty: true });
              }}
              onSelectSuggestion={(place: PlaceSuggestion) => {
                setValue("location", place.label, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setValue("latitude", place.lat, { shouldDirty: true });
                setValue("longitude", place.lng, { shouldDirty: true });
              }}
              placeholder={t("events.form.venuePlaceholder")}
              invalid={Boolean(errors.location)}
              describedBy={errors.location ? "event-location-error" : undefined}
              className={`w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${getFieldHighlightClass("location")}`}
            />
            {errors.location && (
              <p id="event-location-error" role="alert" className="mt-1 text-xs text-destructive">
                {getLocalizedValidationMessage(errors.location.message)}
              </p>
            )}
          </div>

          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("events.form.mapCoordinates")}
            </label>
            <div className="overflow-hidden rounded-xl border border-border/80 shadow-2xs">
              <EventLocationPickerDynamic
                address={watchedLocation || ""}
                latitude={watchedLatitude}
                longitude={watchedLongitude}
                className="w-full"
                onChange={(coords: LatLng | null) => {
                  setValue("latitude", coords?.lat ?? null, { shouldDirty: true });
                  setValue("longitude", coords?.lng ?? null, { shouldDirty: true });
                }}
                onAddressChange={(newAddress: string) => {
                  setValue("location", newAddress, { shouldDirty: true, shouldValidate: true });
                }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("events.form.mapCoordinatesHelp")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
