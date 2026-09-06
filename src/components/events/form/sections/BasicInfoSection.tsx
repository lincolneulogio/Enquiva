"use client";

import React, { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import type { CreateEventInput } from "@/lib/validations";
import type { CategoryOption } from "../types";
import { categoryLabel } from "@/lib/utils";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { EventTypeSelector } from "./EventTypeSelector";

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
  currentEventType?: string;
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
  currentEventType,
  locale,
  getFieldHighlightClass,
  getLocalizedValidationMessage,
  t,
}: BasicInfoSectionProps) {
  const [isImproving, setIsImproving] = useState(false);

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5 transition-all">
      <div className="space-y-1.5">
        <label htmlFor="event-title" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {t("events.form.title") || t("events.form.eventTitle")} <span className="text-destructive">*</span>
        </label>
        <input
          id="event-title"
          {...register("title")}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "event-title-error" : undefined}
          placeholder={t("events.form.titlePlaceholder") || t("events.form.eventTitlePlaceholder")}
          className={`w-full rounded-xl border bg-background/80 px-4 py-2.5 text-base font-medium text-foreground placeholder:text-muted-foreground/60 transition-all hover:border-border focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            errors.title ? "border-destructive ring-1 ring-destructive" : "border-border/80"
          } ${getFieldHighlightClass("title")}`}
        />
        {errors.title && (
          <p id="event-title-error" role="alert" className="mt-1 text-xs text-destructive">
            {getLocalizedValidationMessage(errors.title.message)}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="event-description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("events.form.description")} <span className="text-destructive">*</span>
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
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-all hover:bg-primary/20 hover:border-primary/40 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
          >
            {isImproving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{locale === "en" ? "Improving…" : "Mejorando…"}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 text-primary" />
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
        {errors.description && (
          <p id="event-description-error" role="alert" className="mt-1 text-xs text-destructive">
            {getLocalizedValidationMessage(errors.description.message)}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 pt-1">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="event-category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("events.form.category")} <span className="text-destructive">*</span>
            </label>
            <span className="text-[11px] font-medium text-muted-foreground/70">
              {categoryOptions.length} {locale === "en" ? "categories" : "categorías"}
            </span>
          </div>
          <div className="relative">
            <select
              id="event-category"
              {...register("category")}
              aria-invalid={Boolean(errors.category)}
              aria-describedby={errors.category ? "event-category-error" : undefined}
              className={`w-full appearance-none rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${getFieldHighlightClass("category")}`}
            >
              {categoryOptions.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.label || categoryLabel(cat.slug, locale)}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted-foreground">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {errors.category && (
            <p id="event-category-error" role="alert" className="mt-1 text-xs text-destructive">
              {getLocalizedValidationMessage(errors.category.message)}
            </p>
          )}
        </div>

        <EventTypeSelector
          register={register}
          errors={errors}
          suggestedTypes={suggestedTypes}
          currentValue={currentEventType}
          getFieldHighlightClass={getFieldHighlightClass}
          getLocalizedValidationMessage={getLocalizedValidationMessage}
          t={t}
          locale={locale}
        />
      </div>
    </div>
  );
}
