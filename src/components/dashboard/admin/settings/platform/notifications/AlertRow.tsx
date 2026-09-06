"use client";

import type { AlertItem } from "./notification-alert-items";

interface AlertRowProps {
  alert: AlertItem;
  locale: "es" | "en";
}

export function AlertRow({ alert, locale }: AlertRowProps) {
  return (
    <div
      className={`flex items-start sm:items-center justify-between gap-3 rounded-xl border p-4 transition-colors ${alert.tone.row}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${alert.tone.icon}`}
        >
          <alert.Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 space-y-1 pr-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">
              {locale === "en" ? alert.titleEn : alert.titleEs}
            </p>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${alert.tone.chip}`}
            >
              {locale === "en" ? alert.chipEn : alert.chipEs}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {locale === "en" ? alert.descEn : alert.descEs}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={alert.onChange}
        aria-pressed={alert.checked}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          alert.checked ? alert.tone.toggleOn : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            alert.checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
