"use client";

import React from "react";
import type { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import type { CreateEventInput } from "@/lib/validations";
import type { CategoryOption } from "../types";
import { categoryLabel } from "@/lib/utils";
import { toast } from "sonner";

interface BasicInfoSectionProps {
  register: UseFormRegister<CreateEventInput>;
  errors: FieldErrors<CreateEventInput>;
  setValue: UseFormSetValue<CreateEventInput>;
  currentDescription?: string;
  categoryOptions: CategoryOption[];
  suggestedTypes: Array<{ slug: string; label: string }>;
  locale: "es" | "en";
  getFieldHighlightClass: (field: keyof CreateEventInput) => string;
  getLocalizedValidationMessage: (message?: string) => string;
  t: (key: string) => string;
}

export function BasicInfoSection({
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
}: BasicInfoSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="event-title" className="mb-1.5 block text-sm font-medium text-foreground">
          {t("events.form.eventTitle")}
        </label>
        <input
          id="event-title"
          {...register("title")}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "event-title-error" : undefined}
          placeholder={t("events.form.eventTitlePlaceholder")}
          className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${getFieldHighlightClass("title")}`}
        />
        {errors.title && (
          <p id="event-title-error" role="alert" className="mt-1 text-xs text-destructive">
            {getLocalizedValidationMessage(errors.title.message)}
          </p>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="event-description" className="text-sm font-medium text-foreground">
            {t("events.form.description")}
          </label>
          <button
            type="button"
            onClick={async () => {
              try {
                const response = await fetch("/api/ai/improve-description", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ description: currentDescription || "" }),
                });
                if (!response.ok) throw new Error();
                const data = await response.json();
                if (data.improved) {
                  setValue("description", data.improved);
                  toast.success(t("events.form.descriptionImproved"));
                }
              } catch {
                toast.error(t("events.form.descriptionImproveError"));
              }
            }}
            className="text-xs text-primary hover:underline cursor-pointer"
          >
            {t("events.form.improveWithAi")}
          </button>
        </div>
        <textarea
          id="event-description"
          {...register("description")}
          rows={4}
          placeholder={t("events.form.descriptionPlaceholder")}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="event-category" className="mb-1.5 block text-sm font-medium text-foreground">
            {t("events.form.category")}
          </label>
          <select
            id="event-category"
            {...register("category")}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? "event-category-error" : undefined}
            className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none ${getFieldHighlightClass("category")}`}
          >
            {categoryOptions.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.label || categoryLabel(cat.slug, locale)}
              </option>
            ))}
          </select>
          {errors.category && (
            <p id="event-category-error" role="alert" className="mt-1 text-xs text-destructive">
              {getLocalizedValidationMessage(errors.category.message)}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="event-type" className="mb-1.5 block text-sm font-medium text-foreground">
            {t("events.form.eventType")}
          </label>
          <select
            id="event-type"
            {...register("eventType")}
            aria-invalid={Boolean(errors.eventType)}
            aria-describedby={errors.eventType ? "event-type-error" : undefined}
            className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none ${getFieldHighlightClass("eventType")}`}
          >
            {suggestedTypes.map((type) => (
              <option key={type.slug} value={type.slug}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.eventType && (
            <p id="event-type-error" role="alert" className="mt-1 text-xs text-destructive">
              {getLocalizedValidationMessage(errors.eventType.message)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
