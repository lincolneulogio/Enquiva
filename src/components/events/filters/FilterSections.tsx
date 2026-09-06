"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import type { EventFiltersState } from "./types";
import { FilterDateModalityPrice } from "./FilterDateModalityPrice";
import { FilterAccessStatusLocation } from "./FilterAccessStatusLocation";

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

  const handleFilterClick = (updates: Partial<Record<keyof EventFiltersState, string | undefined>>) => {
    onUpdateFilter(updates);
    onOptionClick?.();
  };

  return (
    <div className="space-y-6">
      <FilterDateModalityPrice
        currentFilters={currentFilters}
        locale={locale}
        onFilterClick={handleFilterClick}
      />

      <FilterAccessStatusLocation
        currentFilters={currentFilters}
        locationInput={locationInput}
        locale={locale}
        onLocationChange={onLocationChange}
        onLocationSubmit={onLocationSubmit}
        onFilterClick={handleFilterClick}
      />
    </div>
  );
}
