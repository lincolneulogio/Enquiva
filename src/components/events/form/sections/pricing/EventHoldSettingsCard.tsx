"use client";

import React from "react";
import { Clock } from "lucide-react";
import type { UseFormRegister } from "react-hook-form";
import type { CreateEventInput } from "@/lib/validations";

interface EventHoldSettingsCardProps {
  register: UseFormRegister<CreateEventInput>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function EventHoldSettingsCard({ register, t }: EventHoldSettingsCardProps) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5 transition-all md:col-span-2">
      <div className="border-b border-border/60 pb-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clock className="h-4 w-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("events.form.holdSettingsTitle")}
          </h3>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed ml-9">
          {t("events.form.holdSettingsHelp")}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground">
            {t("events.form.holdMinutesCard")}
          </label>
          <input
            type="number"
            min={5}
            max={120}
            {...register("holdMinutesCard", { valueAsNumber: true })}
            className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-all hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground">
            {t("events.form.holdHoursManual")}
          </label>
          <input
            type="number"
            min={1}
            max={72}
            {...register("holdHoursManual", { valueAsNumber: true })}
            className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-all hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground">
            {t("events.form.nearEventHoldMinutes")}
          </label>
          <input
            type="number"
            min={5}
            max={60}
            {...register("nearEventHoldMinutes", { valueAsNumber: true })}
            className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-all hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground">
            {t("events.form.nearEventWindowHours")}
          </label>
          <input
            type="number"
            min={1}
            max={168}
            {...register("nearEventWindowHours", { valueAsNumber: true })}
            className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-all hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
          <label className="block text-xs font-medium text-muted-foreground">
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
            className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-all hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
    </div>
  );
}
