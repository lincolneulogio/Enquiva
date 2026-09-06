"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { CreateEventInput } from "@/lib/validations";

interface EventTypeSelectorProps {
  register: UseFormRegister<CreateEventInput>;
  errors: FieldErrors<CreateEventInput>;
  suggestedTypes: Array<{ slug: string; label: string }>;
  currentValue?: string;
  getFieldHighlightClass: (field: keyof CreateEventInput) => string;
  getLocalizedValidationMessage: (message?: string) => string;
  t: (key: string) => string;
  locale: "es" | "en";
}

export function EventTypeSelector({
  register,
  errors,
  suggestedTypes,
  getFieldHighlightClass,
  getLocalizedValidationMessage,
  t,
  locale,
}: EventTypeSelectorProps) {
  const hasTypes = suggestedTypes.length > 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor="event-type"
          className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
        >
          {t("events.form.eventType")} <span className="text-destructive">*</span>
        </label>
        {hasTypes && (
          <span className="text-[11px] font-medium text-muted-foreground/70">
            {suggestedTypes.length} {locale === "en" ? "types" : "disponibles"}
          </span>
        )}
      </div>

      <div className="relative">
        <select
          id="event-type"
          {...register("eventType")}
          disabled={!hasTypes}
          aria-invalid={Boolean(errors.eventType)}
          aria-describedby={errors.eventType ? "event-type-error" : undefined}
          className={`w-full appearance-none rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${getFieldHighlightClass("eventType")}`}
        >
          {hasTypes ? (
            suggestedTypes.map((type) => (
              <option key={type.slug} value={type.slug}>
                {type.label}
              </option>
            ))
          ) : (
            <option value="">
              {locale === "en"
                ? "No event types available for this category"
                : "No hay tipos de evento disponibles para esta categoría"}
            </option>
          )}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {errors.eventType && (
        <p id="event-type-error" role="alert" className="mt-1 text-xs text-destructive">
          {getLocalizedValidationMessage(errors.eventType.message)}
        </p>
      )}
    </div>
  );
}
