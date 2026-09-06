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
                        aria-describedby={
                            errors.virtualLink ? "event-virtual-link-error" : "event-virtual-link-help"
                        }
                        placeholder={t("events.form.meetingLinkPlaceholder")}
                        className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none ${getFieldHighlightClass("virtualLink")}`}
                    />
                    <p id="event-virtual-link-help" className="mt-1 text-xs text-muted-foreground">
                        {t("events.form.meetingLinkHelp")}
                    </p>
                    {errors.virtualLink && (
                        <p id="event-virtual-link-error" role="alert" className="mt-1 text-xs text-destructive">
                            {getLocalizedValidationMessage(errors.virtualLink.message)}
                        </p>
                    )}
                    {planMaxAttendees != null && (
                        <p className="mt-2 text-xs text-muted-foreground">
                            {t("events.form.virtualCapacityHelpPlan", { max: planMaxAttendees })}
                        </p>
                    )}
                </div>
            ) : (
                <div key="physical-fields">
                    <VenueAddressAutocomplete
                        id="event-location"
                        value={watchedLocation ?? ""}
                        onChange={(next) => {
                            setValue("location", next, {
                                shouldDirty: true,
                                shouldValidate: true,
                            });
                        }}
                        onSelectSuggestion={(suggestion: PlaceSuggestion) => {
                            setValue("location", suggestion.label, {
                                shouldDirty: true,
                                shouldValidate: true,
                                shouldTouch: true,
                            });
                            setValue("latitude", suggestion.lat, {
                                shouldDirty: true,
                                shouldValidate: true,
                            });
                            setValue("longitude", suggestion.lng, {
                                shouldDirty: true,
                                shouldValidate: true,
                            });
                        }}
                        invalid={Boolean(errors.location || errors.latitude)}
                        describedBy={
                            errors.location || errors.latitude ? "event-location-error" : undefined
                        }
                        placeholder={t("events.form.venuePlaceholder")}
                        inputClassName={getFieldHighlightClass("location")}
                    />
                    {(errors.location || errors.latitude) && (
                        <p id="event-location-error" role="alert" className="mt-1 text-xs text-destructive">
                            {getLocalizedValidationMessage(
                                errors.location?.message || errors.latitude?.message,
                            )}
                        </p>
                    )}
                    <EventLocationPickerDynamic
                        className="mt-3"
                        address={watchedLocation ?? ""}
                        latitude={typeof watchedLatitude === "number" ? watchedLatitude : null}
                        longitude={typeof watchedLongitude === "number" ? watchedLongitude : null}
                        onChange={(coords: LatLng | null) => {
                            setValue("latitude", coords?.lat ?? null, {
                                shouldDirty: true,
                                shouldValidate: true,
                            });
                            setValue("longitude", coords?.lng ?? null, {
                                shouldDirty: true,
                                shouldValidate: true,
                            });
                        }}
                        onAddressChange={(nextAddress) => {
                            setValue("location", nextAddress, {
                                shouldDirty: true,
                                shouldValidate: true,
                                shouldTouch: true,
                            });
                        }}
                        onRequestEditAddress={() => {
                            document.getElementById("event-location")?.focus();
                        }}
                    />
                </div>
            )}
        </div>
    );
}
