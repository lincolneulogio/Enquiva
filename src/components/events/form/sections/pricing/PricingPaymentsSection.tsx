"use client";

import React from "react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { CreateEventInput } from "@/lib/validations";
import { EventHoldSettingsCard } from "./EventHoldSettingsCard";
import { EventPaymentMethodSelector } from "./EventPaymentMethodSelector";

interface PricingPaymentsSectionProps {
  isVirtual?: boolean;
  register: UseFormRegister<CreateEventInput>;
  errors: FieldErrors<CreateEventInput>;
  capacityField: any;
  handleCapacityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCapacityBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  planMaxAttendees?: number | null;
  watchedPrice?: number;
  selectablePaymentMethods: Array<{ id: string; type: string; label: string; holderName: string }>;
  requiresPaymentMethods: boolean;
  selectedPaymentMethodIds: string[];
  setSelectedPaymentMethodIds: React.Dispatch<React.SetStateAction<string[]>>;
  getFieldHighlightClass: (field: keyof CreateEventInput) => string;
  getLocalizedValidationMessage: (message?: string) => string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function PricingPaymentsSection({
  isVirtual,
  register,
  errors,
  capacityField,
  handleCapacityChange,
  handleCapacityBlur,
  planMaxAttendees,
  watchedPrice,
  selectablePaymentMethods,
  requiresPaymentMethods,
  selectedPaymentMethodIds,
  setSelectedPaymentMethodIds,
  getFieldHighlightClass,
  getLocalizedValidationMessage,
  t,
}: PricingPaymentsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5 transition-all">
        <div className="grid gap-4 sm:grid-cols-2">
          {!isVirtual && (
            <div className="space-y-1.5">
              <label htmlFor="event-capacity" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("events.form.capacity")}{" "}
                <span className="font-normal lowercase text-muted-foreground/80">{t("events.form.optional")}</span>
              </label>
              <div className="relative">
                <input
                  id="event-capacity"
                  type="number"
                  {...capacityField}
                  onChange={handleCapacityChange}
                  onBlur={handleCapacityBlur}
                  placeholder={
                    planMaxAttendees != null
                      ? t("events.form.capacityPlaceholderPlan", { max: planMaxAttendees })
                      : t("events.form.capacityPlaceholder")
                  }
                  min={1}
                  max={planMaxAttendees ?? undefined}
                  inputMode="numeric"
                  aria-invalid={Boolean(errors.capacity)}
                  aria-describedby={
                    errors.capacity
                      ? "event-capacity-help event-capacity-error"
                      : "event-capacity-help"
                  }
                  className={`w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${getFieldHighlightClass("capacity")}`}
                />
              </div>
              <p id="event-capacity-help" className="text-xs text-muted-foreground">
                {planMaxAttendees != null
                  ? t("events.form.capacityHelpPlan", { max: planMaxAttendees })
                  : t("events.form.capacityHelp")}
              </p>
              {errors.capacity && (
                <p id="event-capacity-error" role="alert" className="mt-1 text-xs text-destructive">
                  {getLocalizedValidationMessage(errors.capacity.message)}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="event-price" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("events.form.price")}{" "}
              <span className="font-normal lowercase text-muted-foreground/80">{t("events.form.optional")}</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-sm font-bold text-muted-foreground select-none">
                S/
              </span>
              <input
                id="event-price"
                type="number"
                step="0.01"
                min="0"
                {...register("price", {
                  setValueAs: (value) => {
                    if (value === "" || value === null || value === undefined) return undefined;
                    const num = Number(value);
                    return Number.isNaN(num) ? undefined : num;
                  },
                })}
                placeholder="0.00"
                className="w-full rounded-xl border border-border/80 bg-background pl-9 pr-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("events.form.priceHelp")}</p>
          </div>
        </div>
      </div>

      {!!watchedPrice && Number(watchedPrice) > 0 && (
        <EventHoldSettingsCard register={register} t={t} />
      )}

      {selectablePaymentMethods.length > 0 && requiresPaymentMethods && (
        <EventPaymentMethodSelector
          selectablePaymentMethods={selectablePaymentMethods}
          selectedPaymentMethodIds={selectedPaymentMethodIds}
          setSelectedPaymentMethodIds={setSelectedPaymentMethodIds}
          t={t}
        />
      )}
    </div>
  );
}
