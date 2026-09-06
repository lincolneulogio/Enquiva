"use client";

import { Filter, X } from "lucide-react";
import { FilterSections } from "./FilterSections";
import type { EventFiltersState } from "./types";

interface MobileFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: EventFiltersState;
  locationInput: string;
  onLocationChange: (val: string) => void;
  onLocationSubmit: (e: React.FormEvent) => void;
  onUpdateFilter: (updates: Partial<Record<keyof EventFiltersState, string | undefined>>) => void;
  onClearFilters: () => void;
}

export function MobileFiltersDrawer({
  isOpen,
  onClose,
  currentFilters,
  locationInput,
  onLocationChange,
  onLocationSubmit,
  onUpdateFilter,
  onClearFilters,
}: MobileFiltersDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs lg:hidden">
      <div className="relative ml-auto flex h-full w-full max-w-xs flex-col bg-background p-6 shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h3 className="text-base font-bold text-foreground">Filtros</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-6">
          <FilterSections
            currentFilters={currentFilters}
            locationInput={locationInput}
            onLocationChange={onLocationChange}
            onLocationSubmit={(e) => {
              onLocationSubmit(e);
              onClose();
            }}
            onUpdateFilter={onUpdateFilter}
            onOptionClick={onClose}
          />

          <button
            type="button"
            onClick={() => {
              onClearFilters();
              onClose();
            }}
            className="w-full rounded-xl bg-muted py-2.5 text-xs font-bold text-foreground hover:bg-muted/80 cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  );
}
