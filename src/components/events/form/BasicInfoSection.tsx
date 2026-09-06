"use client";

import React from "react";
import type { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import type { CreateEventInput } from "@/lib/validations";
import type { CategoryOption } from "./types";
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
                </div>
                <textarea
                    id="event-description"
                    {...register("description")}
                    aria-invalid={Boolean(errors.description)}
                    aria-describedby={errors.description ? "event-description-error" : undefined}
                    rows={6}
                    placeholder={t("events.form.descriptionPlaceholder")}
                    className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none ${getFieldHighlightClass("description")}`}
                />
                {errors.description && (
                    <p id="event-description-error" role="alert" className="mt-1 text-xs text-destructive">
                        {getLocalizedValidationMessage(errors.description.message)}
                    </p>
                )}
            </div>

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
                    <option value="">{t("events.form.selectCategory")}</option>
                    {categoryOptions.map((cat) => (
                        <option key={cat.slug} value={cat.slug}>
                            {cat.label || categoryLabel(cat.slug, locale)}
                        </option>
                    ))}
                </select>
                {suggestedTypes.length > 0 && (
                    <div className="mt-2.5">
                        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                            {locale === "en" ? "Suggested formats for this category:" : "Formatos sugeridos para esta categoría:"}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {suggestedTypes.map((typeOption) => (
                                <button
                                    key={typeOption.slug}
                                    type="button"
                                    onClick={() => {
                                        const current = currentDescription || "";
                                        if (!current.toLowerCase().includes(typeOption.label.toLowerCase())) {
                                            const prefix = current.trim() ? `${current}\n\n` : "";
                                            setValue("description", `${prefix}Tipo de evento: ${typeOption.label}`, {
                                                shouldDirty: true,
                                                shouldValidate: true,
                                            });
                                            toast.success(`${typeOption.label} agregado a la descripción`);
                                        }
                                    }}
                                    className="rounded-full border border-border/80 bg-muted/40 hover:bg-primary/10 hover:border-primary/40 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    title={
                                        locale === "en"
                                            ? `Click to mention ${typeOption.label} in description`
                                            : `Haz clic para incluir ${typeOption.label} en la descripción`
                                    }
                                >
                                    + {typeOption.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {errors.category && (
                    <p id="event-category-error" role="alert" className="mt-1 text-xs text-destructive">
                        {getLocalizedValidationMessage(errors.category.message)}
                    </p>
                )}
            </div>
        </div>
    );
}
