"use client";

import { Filter } from "lucide-react";
import { FilterSections } from "./FilterSections";
import type { EventFiltersState } from "./types";

interface DesktopFiltersSidebarProps {
  currentFilters: EventFiltersState;
  totalEvents?: number;
  locationInput: string;
  onLocationChange: (val: string) => void;
  onLocationSubmit: (e: React.FormEvent) => void;
  onUpdateFilter: (updates: Partial<Record<keyof EventFiltersState, string | undefined>>) => void;
  onClearFilters: () => void;
}

export function DesktopFiltersSidebar({
  currentFilters,
  totalEvents,
  locationInput,
  onLocationChange,
  onLocationSubmit,
  onUpdateFilter,
  onClearFilters,
}: DesktopFiltersSidebarProps) {
  return (
    <aside className="hidden rounded-3xl border border-border/80 bg-card p-5 shadow-xs lg:block">
      {/* Cabecera con Limpiar */}
      <div className="mb-5 flex items-center justify-between border-b border-border/70 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Filtros</h2>
            <p className="text-[11px] text-muted-foreground">
              {totalEvents != null ? `${totalEvents} eventos encontrados` : "Personaliza tu búsqueda"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClearFilters}
          className="text-xs font-semibold text-primary transition hover:underline cursor-pointer"
        >
          Limpiar
        </button>
      </div>

      <FilterSections
        currentFilters={currentFilters}
        locationInput={locationInput}
        onLocationChange={onLocationChange}
        onLocationSubmit={onLocationSubmit}
        onUpdateFilter={onUpdateFilter}
      />
    </aside>
  );
}
