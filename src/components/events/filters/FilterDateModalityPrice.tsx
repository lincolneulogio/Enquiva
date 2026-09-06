"use client";

import React from "react";
import { Calendar, SlidersHorizontal, CreditCard, Laptop, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MODALITY_OPTIONS,
  DATE_FILTER_OPTIONS,
  PRICE_FILTER_OPTIONS,
} from "@/lib/events/taxonomy";
import type { EventFiltersState } from "./types";

interface FilterDateModalityPriceProps {
  currentFilters: EventFiltersState;
  locale: "es" | "en";
  onFilterClick: (updates: Partial<Record<keyof EventFiltersState, string | undefined>>) => void;
}

export function FilterDateModalityPrice({
  currentFilters,
  locale,
  onFilterClick,
}: FilterDateModalityPriceProps) {
  return (
    <>
      {/* 1. FECHA */}
      <div>
        <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span>{locale === "en" ? "Date" : "Fecha"}</span>
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {DATE_FILTER_OPTIONS.map((opt) => {
            const isSelected = (currentFilters.date ?? "all") === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onFilterClick({ date: opt.value === "all" ? undefined : opt.value })}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
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

      {/* 2. MODALIDAD */}
      <div>
        <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
          <span>{locale === "en" ? "Modality" : "Modalidad"}</span>
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {MODALITY_OPTIONS.map((opt) => {
            const isSelected = (currentFilters.modality ?? "all") === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onFilterClick({ modality: opt.value === "all" ? undefined : opt.value })}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "border border-border/70 bg-card text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {opt.value === "in_person" && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                {opt.value === "online" && <Laptop className="h-3.5 w-3.5 shrink-0" />}
                {opt.value === "hybrid" && <Shuffle className="h-3.5 w-3.5 shrink-0" />}
                <span>{locale === "en" ? opt.labelEn : opt.labelEs}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. PRECIO */}
      <div>
        <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <CreditCard className="h-3.5 w-3.5 text-primary" />
          <span>{locale === "en" ? "Price" : "Precio"}</span>
        </h3>
        <div className="grid grid-cols-3 gap-1.5">
          {PRICE_FILTER_OPTIONS.map((opt) => {
            const isSelected = (currentFilters.price ?? "all") === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onFilterClick({ price: opt.value === "all" ? undefined : opt.value })}
                className={cn(
                  "rounded-xl px-2 py-1.5 text-center text-xs font-medium transition-colors cursor-pointer",
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
    </>
  );
}
