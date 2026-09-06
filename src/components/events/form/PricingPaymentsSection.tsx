"use client";

import React from "react";
import { CreditCard, Smartphone, QrCode, Wallet } from "lucide-react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import type { CreateEventInput } from "@/lib/validations";

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
                <div className="space-y-3 rounded-xl border border-border p-4 md:col-span-2">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">
                            {t("events.form.holdSettingsTitle")}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {t("events.form.holdSettingsHelp")}
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-foreground">
                                {t("events.form.holdMinutesCard")}
                            </label>
                            <input
                                type="number"
                                min={5}
                                max={120}
                                {...register("holdMinutesCard", { valueAsNumber: true })}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-foreground">
                                {t("events.form.holdHoursManual")}
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={72}
                                {...register("holdHoursManual", { valueAsNumber: true })}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-foreground">
                                {t("events.form.nearEventHoldMinutes")}
                            </label>
                            <input
                                type="number"
                                min={5}
                                max={60}
                                {...register("nearEventHoldMinutes", { valueAsNumber: true })}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-foreground">
                                {t("events.form.nearEventWindowHours")}
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={168}
                                {...register("nearEventWindowHours", { valueAsNumber: true })}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-foreground">
                                {t("events.form.salesCutoffHoursBefore")}
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={168}
                                {...register("salesCutoffHoursBefore", {
                                    setValueAs: (v) => {
                                        if (v === "" || v == null) return null;
                                        const n = Number(v);
                                        return Number.isNaN(n) ? null : n;
                                    },
                                })}
                                placeholder={t("events.form.salesCutoffPlaceholder")}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            )}

            {selectablePaymentMethods.length > 0 && requiresPaymentMethods && (
                <div
                    id="event-payment-methods-section"
                    className={`rounded-xl border p-4 space-y-3 transition-all ${
                        selectedPaymentMethodIds.length === 0
                            ? "border-destructive/60 bg-destructive/5 ring-2 ring-destructive/20 shadow-xs"
                            : "border-border"
                    }`}
                >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-primary" />
                            <span>{t("events.form.paymentMethodsTitle")}</span>
                            <span className="text-[11px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20">
                                * Obligatorio
                            </span>
                        </h3>
                        {selectedPaymentMethodIds.length === 0 && (
                            <span className="text-[11px] font-bold text-destructive animate-pulse">
                                ⚠️ Selecciona al menos 1 medio de pago
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">{t("events.form.paymentMethodsHelp")}</p>
                    <div className="flex flex-wrap gap-2">
                        {selectablePaymentMethods.map((pm) => {
                            const selected = selectedPaymentMethodIds.includes(pm.id);
                            const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
                                yape: Smartphone,
                                plin: QrCode,
                                cash: Wallet,
                                culqi: CreditCard,
                            };
                            const PmIcon = IconMap[pm.type] ?? Wallet;
                            const isLegacy = pm.type === "yape" || pm.type === "plin";
                            return (
                                <button
                                    key={pm.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedPaymentMethodIds((prev) =>
                                            prev.includes(pm.id)
                                                ? prev.filter((id) => id !== pm.id)
                                                : [...prev, pm.id],
                                        );
                                    }}
                                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                                        selected
                                            ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/30"
                                            : "border-border bg-background text-foreground hover:bg-muted"
                                    }`}
                                >
                                    <PmIcon className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{pm.label}</span>
                                    {isLegacy && (
                                        <span className="text-[10px] uppercase text-amber-700">Legacy</span>
                                    )}
                                    <span className="text-xs text-muted-foreground">({pm.holderName})</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
