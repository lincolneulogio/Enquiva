"use client";

import React from "react";
import { Star, Bus, Lock, Loader2, Check } from "lucide-react";
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
  eventTitle?: string | null;
  register: UseFormRegister<CreateEventInput>;
  errors: FieldErrors<CreateEventInput>;
  watchedStatus?: string;
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
  eventTitle,
  register,
  errors,
  watchedStatus = "draft",
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
  const currentStatus = watchedStatus || (event?.status ?? "draft");

  return (
    <div className="space-y-6 lg:sticky lg:top-24 self-start">
      <EventCoverDropzone
        coverImage={coverImage}
        setCoverImage={setCoverImage}
        coverDropzoneAppearance={coverDropzoneAppearance}
        eventTitle={eventTitle}
        t={t}
      />

      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-3.5 transition-all">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <label htmlFor="event-status" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("events.form.status")}
          </label>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border",
              currentStatus === "published"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : currentStatus === "cancelled"
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                currentStatus === "published"
                  ? "bg-emerald-500 animate-pulse"
                  : currentStatus === "cancelled"
                    ? "bg-destructive"
                    : "bg-amber-500",
              )}
            />
            {currentStatus === "published"
              ? t("eventStatus.published")
              : currentStatus === "cancelled"
                ? t("eventStatus.cancelled")
                : t("eventStatus.draft")}
          </span>
        </div>

        <div className="relative">
          <select
            id="event-status"
            {...register("status")}
            aria-invalid={Boolean(errors.status)}
            aria-describedby={errors.status ? "event-status-error" : undefined}
            className={`w-full appearance-none rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${getFieldHighlightClass("status")}`}
          >
            <option value="draft">{t("eventStatus.draft")}</option>
            <option value="published">{t("eventStatus.published")}</option>
            <option value="cancelled">{t("eventStatus.cancelled")}</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {locale === "en"
            ? "The event will be visible publicly on Enquiva and will accept attendee registrations when published."
            : "El evento es visible públicamente en el catálogo de Enquiva y permite registros."}
        </p>

        {errors.status && (
          <p id="event-status-error" role="alert" className="mt-1 text-xs text-destructive">
            {getLocalizedValidationMessage(errors.status.message)}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4 transition-all">
        <div className="border-b border-border/60 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {locale === "en" ? "Additional Options" : "Opciones Adicionales"}
          </h3>
        </div>

        <label
          className={cn(
            "flex items-start gap-3 rounded-xl border p-4 transition-all",
            canUseTransport
              ? "border-border/80 bg-background/60 hover:border-border cursor-pointer"
              : "border-border/60 bg-muted/20 cursor-not-allowed opacity-75",
          )}
        >
          <input
            type="checkbox"
            {...register("hasTransport")}
            disabled={!canUseTransport}
            className="mt-0.5 rounded border-border text-primary focus:ring-primary/20"
          />
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <Bus className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">
                {t("events.form.offerTransport")}
              </p>
              {!canUseTransport && <Lock className="h-3.5 w-3.5 text-muted-foreground ml-auto" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {!canUseTransport ? (
                <span className="text-muted-foreground">
                  Disponible en plan Pro.{" "}
                  <span className="text-primary font-semibold underline">Mejora en Aranceles/Billing</span>
                </span>
              ) : hasTransport ? (
                t("events.form.transportEnabledHelp")
              ) : (
                t("events.form.transportDisabledHelp")
              )}
            </p>
          </div>
        </label>

        <EventCertificateSettings
          register={register}
          hasCertificate={hasCertificate}
          locale={locale}
        />

        {canFeature && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 transition-all hover:border-amber-500/50">
            <input
              type="checkbox"
              {...register("isFeatured")}
              className="mt-0.5 rounded border-amber-500/40 text-amber-600 focus:ring-amber-500/20"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <p className="text-sm font-semibold text-foreground">
                  {t("events.form.featureEvent")}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t("events.form.featureEventHelp")}</p>
            </div>
          </label>
        )}
      </div>

      <div className="space-y-2 pt-2">
        <button
          type="submit"
          disabled={isPending || (!event && !canCreateEvent)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary via-primary to-primary/95 py-3.5 px-6 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/95 hover:shadow-xl hover:shadow-primary/35 hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Check className="h-5 w-5 stroke-[2.5]" />
              <span>{event ? t("events.form.saveChanges") : t("events.form.createEvent")}</span>
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-muted-foreground font-medium">
          {locale === "en"
            ? "Changes are immediately reflected on the event public page."
            : "Los cambios se reflejarán instantáneamente en la web pública del evento."}
        </p>
      </div>
    </div>
  );
}
