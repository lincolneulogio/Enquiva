"use client";

import React from "react";
import type { UseFormRegister } from "react-hook-form";
import type { CreateEventInput } from "@/lib/validations";

interface EventHoldSettingsCardProps {
  register: UseFormRegister<CreateEventInput>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function EventHoldSettingsCard({ register, t }: EventHoldSettingsCardProps) {
  return (
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
  );
}
