"use client";

import React from "react";
import { Star, Bus, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { CreateEventInput } from "@/lib/validations";
import type { Event } from "@/lib/db/schema";
import { EventCoverDropzone } from "./EventCoverDropzone";
import { EventCertificateSettings } from "./EventCertificateSettings";

interface MediaSettingsSectionProps {
  coverImage: string | null;
  setCoverImage: (url: string | null) => void;
  coverDropzoneAppearance: any;
  register: UseFormRegister<CreateEventInput>;
  errors: FieldErrors<CreateEventInput>;
  canFeature?: boolean;
  canUseTransport: boolean;
  hasTransport?: boolean;
  hasCertificate?: boolean;
  isPending: boolean;
  event?: Event;
  canCreateEvent: boolean;
  getFieldHighlightClass: (field: keyof CreateEventInput) => string;
  getLocalizedValidationMessage: (message?: string) => string;
  locale: "es" | "en";
  t: (key: string) => string;
}

export function MediaSettingsSection({
  coverImage,
  setCoverImage,
  coverDropzoneAppearance,
  register,
  errors,
  canFeature,
  canUseTransport,
  hasTransport,
  hasCertificate,
  isPending,
  event,
  canCreateEvent,
  getFieldHighlightClass,
  getLocalizedValidationMessage,
  locale,
  t,
}: MediaSettingsSectionProps) {
  return (
    <div className="space-y-6">
      <EventCoverDropzone
        coverImage={coverImage}
        setCoverImage={setCoverImage}
        coverDropzoneAppearance={coverDropzoneAppearance}
        t={t}
      />

      <div>
        <label htmlFor="event-status" className="mb-1.5 block text-sm font-medium text-foreground">
          {t("events.form.status")}
        </label>
        <select
          id="event-status"
          {...register("status")}
          aria-invalid={Boolean(errors.status)}
          aria-describedby={errors.status ? "event-status-error" : undefined}
          className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none ${getFieldHighlightClass("status")}`}
        >
          <option value="draft">{t("eventStatus.draft")}</option>
          <option value="published">{t("eventStatus.published")}</option>
          <option value="cancelled">{t("eventStatus.cancelled")}</option>
        </select>
        {errors.status && (
          <p id="event-status-error" role="alert" className="mt-1 text-xs text-destructive">
            {getLocalizedValidationMessage(errors.status.message)}
          </p>
        )}
      </div>

      {canFeature && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4">
          <input
            type="checkbox"
            {...register("isFeatured")}
            className="mt-0.5 rounded border-border"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              <p className="text-sm font-medium text-foreground">
                {t("events.form.featureEvent")}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{t("events.form.featureEventHelp")}</p>
          </div>
        </label>
      )}

      <label
        className={cn(
          "flex items-start gap-3 rounded-xl border border-border p-4",
          canUseTransport ? "cursor-pointer" : "cursor-not-allowed opacity-70",
        )}
      >
        <input
          type="checkbox"
          {...register("hasTransport")}
          disabled={!canUseTransport}
          className="mt-0.5 rounded border-border"
        />
        <div>
          <div className="flex items-center gap-1.5">
            <Bus className="h-3.5 w-3.5 text-primary" />
            <p className="text-sm font-medium text-foreground">
              {t("events.form.offerTransport")}
            </p>
            {!canUseTransport && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground">
            {!canUseTransport
              ? "Disponible en plan Pro. Mejora en /organizer/billing"
              : hasTransport
                ? t("events.form.transportEnabledHelp")
                : t("events.form.transportDisabledHelp")}
          </p>
        </div>
      </label>

      {/* Certificado Digital (Opcional) */}
      <EventCertificateSettings
        register={register}
        hasCertificate={hasCertificate}
        locale={locale}
      />

      <button
        type="submit"
        disabled={isPending || (!event && !canCreateEvent)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : event ? (
          t("events.form.saveChanges")
        ) : (
          t("events.form.createEvent")
        )}
      </button>
    </div>
  );
}
