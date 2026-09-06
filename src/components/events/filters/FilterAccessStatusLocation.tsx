"use client";

import React, { useId } from "react";
import { Ticket, Clock3, MapPin, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ACCESS_TYPE_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "@/lib/events/taxonomy";
import type { EventFiltersState } from "./types";

interface FilterAccessStatusLocationProps {
  currentFilters: EventFiltersState;
  locationInput: string;
  locale: "es" | "en";
  onLocationChange: (val: string) => void;
  onLocationSubmit: (e: React.FormEvent) => void;
  onFilterClick: (updates: Partial<Record<keyof EventFiltersState, string | undefined>>) => void;
}

export function FilterAccessStatusLocation({
  currentFilters,
  locationInput,
  locale,
  onLocationChange,
  onLocationSubmit,
  onFilterClick,
}: FilterAccessStatusLocationProps) {
  const locationInputId = useId();

  return (
    <>
      {/* 4. TIPO DE ACCESO */}
      <div>
        <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Ticket className="h-3.5 w-3.5 text-primary" />
          <span>{locale === "en" ? "Access type" : "Tipo de acceso"}</span>
        </h3>
        <div className="space-y-1">
          {ACCESS_TYPE_OPTIONS.map((opt) => {
            const isSelected = (currentFilters.accessType ?? "all") === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onFilterClick({ accessType: opt.value === "all" ? undefined : opt.value })}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-xs font-medium transition-colors cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                <span>{locale === "en" ? opt.labelEn : opt.labelEs}</span>
                {isSelected && <Check className="h-3 w-3" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. ESTADO */}
      <div>
        <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5 text-primary" />
          <span>{locale === "en" ? "Status" : "Estado"}</span>
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {STATUS_FILTER_OPTIONS.map((opt) => {
            const isSelected = (currentFilters.eventStatus ?? "all") === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onFilterClick({ eventStatus: opt.value === "all" ? undefined : opt.value })}
                className={cn(
                  "rounded-xl px-2.5 py-1.5 text-left text-xs font-medium transition-colors cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "border border-border/70 bg-card text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {locale === "en" ? opt.labelEn : opt.labelEs}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. UBICACIÓN / CIUDAD */}
      <div>
        <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span>{locale === "en" ? "Location / City" : "Ubicación / Ciudad"}</span>
        </h3>
        <form onSubmit={onLocationSubmit} className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            id={locationInputId}
            type="text"
            value={locationInput}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="Ej. Huánuco, Lima..."
            className="w-full rounded-xl border border-border/80 bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </form>
      </div>
    </>
  );
}
