"use client";

import React, { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import type { CreateEventInput } from "@/lib/validations";
import type { CategoryOption } from "../types";
import { categoryLabel } from "@/lib/utils";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

/** Extracts plain text from HTML for the AI prompt (no tags, no &nbsp;) */
function htmlToPlainText(html: string): string {
  if (typeof window === "undefined" || !html) return html;
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent ?? div.innerText ?? "";
}

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
  const [isImproving, setIsImproving] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="event-title" className="mb-1.5 block text-sm font-medium text-foreground">
          {t("events.form.title") || t("events.form.eventTitle")}
        </label>
        <input
          id="event-title"
          {...register("title")}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "event-title-error" : undefined}
          placeholder={t("events.form.titlePlaceholder") || t("events.form.eventTitlePlaceholder")}
          className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
            errors.title ? "border-destructive ring-1 ring-destructive" : "border-border"
          } ${getFieldHighlightClass("title")}`}
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
            disabled={isImproving}
            onClick={async () => {
              try {
                setIsImproving(true);
                // Strip HTML tags to send plain text to AI
                const plainText = htmlToPlainText(currentDescription || "");
                const response = await fetch("/api/ai/improve-description", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    description: plainText,
                    locale: locale || "es",
                  }),
                });
                if (!response.ok) {
                  const errJson = await response.json().catch(() => null);
                  throw new Error(errJson?.error || "Error");
                }
                const data = await response.json();
                if (data.improved) {
                  // Convert plain text paragraphs to HTML paragraphs
                  const asHtml = data.improved
                    .split(/\n{2,}/)
                    .map((p: string) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
                    .join("");
                  setValue("description", asHtml, { shouldDirty: true, shouldValidate: true });
                  toast.success(t("events.form.descriptionImproved"));
                }
              } catch {
                toast.error(t("events.form.descriptionImproveError"));
              } finally {
                setIsImproving(false);
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed font-medium"
          >
            {isImproving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{locale === "en" ? "Improving…" : "Mejorando…"}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                <span>{t("events.form.improveWithAi")}</span>
              </>
            )}
          </button>
        </div>
        <RichTextEditor
          id="event-description"
          value={currentDescription || ""}
          onChange={(html) => setValue("description", html, { shouldDirty: true, shouldValidate: true })}
          placeholder={t("events.form.descriptionPlaceholder")}
          minHeight="220px"
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
