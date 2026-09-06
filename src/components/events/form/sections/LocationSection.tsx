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
    <div>
      <div className="mb-2 flex items-center gap-3">
        <label
          htmlFor={isVirtual ? "event-virtual-link" : "event-location"}
          className="text-sm font-medium text-foreground"
        >
          {isVirtual ? t("events.form.meetingLink") : t("events.form.venueAddress")}
        </label>
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <input
            id="event-virtual-toggle"
            type="checkbox"
            {...register("isVirtual")}
            className="rounded border-border"
          />
          <Video className="h-3.5 w-3.5" /> {t("events.form.virtualEvent")}
        </label>
      </div>

      {isVirtual ? (
        <div key="virtual-fields">
          <input
            id="event-virtual-link"
            {...register("virtualLink")}
            aria-invalid={Boolean(errors.virtualLink)}
            aria-describedby={errors.virtualLink ? "event-virtual-link-error" : undefined}
            placeholder={t("events.form.meetingLinkPlaceholder")}
            className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${getFieldHighlightClass("virtualLink")}`}
          />
          {errors.virtualLink && (
            <p id="event-virtual-link-error" role="alert" className="mt-1 text-xs text-destructive">
              {getLocalizedValidationMessage(errors.virtualLink.message)}
            </p>
          )}
        </div>
      ) : (
        <div key="physical-fields" className="space-y-3">
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
            className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${getFieldHighlightClass("location")}`}
          />
          {errors.location && (
            <p id="event-location-error" role="alert" className="mt-1 text-xs text-destructive">
              {getLocalizedValidationMessage(errors.location.message)}
            </p>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {t("events.form.mapCoordinates")}
            </label>
            <EventLocationPickerDynamic
              address={watchedLocation || ""}
              latitude={watchedLatitude}
              longitude={watchedLongitude}
              className="h-60 w-full"
              onChange={(coords: LatLng | null) => {
                setValue("latitude", coords?.lat ?? null, { shouldDirty: true });
                setValue("longitude", coords?.lng ?? null, { shouldDirty: true });
              }}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("events.form.mapCoordinatesHelp")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
