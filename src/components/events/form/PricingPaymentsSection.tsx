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
      {!isVirtual && (
        <div>
          <label htmlFor="event-capacity" className="mb-1.5 block text-sm font-medium text-foreground">
            {t("events.form.capacity")}{" "}
            <span className="font-normal text-muted-foreground">{t("events.form.optional")}</span>
          </label>
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
            className={`w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none ${getFieldHighlightClass("capacity")}`}
          />
          <p id="event-capacity-help" className="mt-1 text-xs text-muted-foreground">
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

      <div>
        <label htmlFor="event-price" className="mb-1.5 block text-sm font-medium text-foreground">
          {t("events.form.price")}{" "}
          <span className="font-normal text-muted-foreground">{t("events.form.optional")}</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
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
            className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{t("events.form.priceHelp")}</p>
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
