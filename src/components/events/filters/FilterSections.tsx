"use client";

import { useId } from "react";
import {
  Calendar,
  SlidersHorizontal,
  CreditCard,
  Ticket,
  Clock3,
  MapPin,
  Laptop,
  Shuffle,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/LocaleProvider";
import {
  MODALITY_OPTIONS,
  DATE_FILTER_OPTIONS,
  PRICE_FILTER_OPTIONS,
  ACCESS_TYPE_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "@/lib/events/taxonomy";
import type { EventFiltersState } from "./types";

interface FilterSectionsProps {
  currentFilters: EventFiltersState;
  locationInput: string;
  onLocationChange: (val: string) => void;
  onLocationSubmit: (e: React.FormEvent) => void;
  onUpdateFilter: (updates: Partial<Record<keyof EventFiltersState, string | undefined>>) => void;
  onOptionClick?: () => void;
}

export function FilterSections({
  currentFilters,
  locationInput,
  onLocationChange,
  onLocationSubmit,
  onUpdateFilter,
  onOptionClick,
}: FilterSectionsProps) {
  const { locale } = useLocale();
  const locationInputId = useId();

  const handleFilterClick = (updates: Partial<Record<keyof EventFiltersState, string | undefined>>) => {
    onUpdateFilter(updates);
    onOptionClick?.();
  };

  return (
    <div className="space-y-6">
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
                onClick={() => handleFilterClick({ date: opt.value === "all" ? undefined : opt.value })}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "border border-border/70 bg-card text-muted-foreground hover:bg-muted/80 hover:text-foreground"
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
                onClick={() => handleFilterClick({ modality: opt.value === "all" ? undefined : opt.value })}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "border border-border/70 bg-card text-muted-foreground hover:bg-muted/80 hover:text-foreground"
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
                onClick={() => handleFilterClick({ price: opt.value === "all" ? undefined : opt.value })}
                className={cn(
                  "rounded-xl px-2 py-1.5 text-center text-xs font-medium transition-colors cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "border border-border/70 bg-card text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {locale === "en" ? opt.labelEn : opt.labelEs}
              </button>
            );
          })}
        </div>
      </div>

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
                onClick={() => handleFilterClick({ accessType: opt.value === "all" ? undefined : opt.value })}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-xs font-medium transition-colors cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
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
                onClick={() => handleFilterClick({ eventStatus: opt.value === "all" ? undefined : opt.value })}
                className={cn(
                  "rounded-xl px-2.5 py-1.5 text-left text-xs font-medium transition-colors cursor-pointer",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "border border-border/70 bg-card text-muted-foreground hover:bg-muted/80 hover:text-foreground"
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
    </div>
  );
}
