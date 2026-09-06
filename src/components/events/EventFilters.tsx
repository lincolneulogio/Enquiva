"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EventFiltersState, CategoryOption, EventFiltersProps } from "./filters/types";
import { DesktopFiltersSidebar } from "./filters/DesktopFiltersSidebar";
import { MobileFiltersDrawer } from "./filters/MobileFiltersDrawer";

export type { EventFiltersState, CategoryOption };

export function EventFilters({
  currentFilters,
  totalEvents,
  className,
}: EventFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [locationInput, setLocationInput] = useState(currentFilters.location ?? "");

  function updateFilter(updates: Partial<Record<keyof EventFiltersState, string | undefined>>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, val]) => {
      if (val && val !== "all" && val.trim() !== "") {
        params.set(key, val.trim());
      } else {
        params.delete(key);
      }
    });
    params.delete("page");

    startTransition(() => {
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  }

  function clearSidebarFilters() {
    setLocationInput("");
    updateFilter({
      date: undefined,
      modality: undefined,
      price: undefined,
      accessType: undefined,
      eventStatus: undefined,
      location: undefined,
    });
  }

  function handleLocationSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateFilter({ location: locationInput || undefined });
  }

  const activeFiltersCount = [
    currentFilters.modality && currentFilters.modality !== "all",
    currentFilters.date && currentFilters.date !== "all",
    currentFilters.price && currentFilters.price !== "all",
    currentFilters.accessType && currentFilters.accessType !== "all",
    currentFilters.eventStatus && currentFilters.eventStatus !== "all",
    currentFilters.location && currentFilters.location.trim() !== "",
  ].filter(Boolean).length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Botón trigger para móvil */}
      <div className="flex items-center justify-between lg:hidden">
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-2xs transition hover:bg-muted"
        >
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <span>Filtros avanzados</span>
          {activeFiltersCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={clearSidebarFilters}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Panel lateral Desktop */}
      <DesktopFiltersSidebar
        currentFilters={currentFilters}
        totalEvents={totalEvents}
        locationInput={locationInput}
        onLocationChange={setLocationInput}
        onLocationSubmit={handleLocationSubmit}
        onUpdateFilter={updateFilter}
        onClearFilters={clearSidebarFilters}
      />

      {/* Drawer Móvil */}
      <MobileFiltersDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        currentFilters={currentFilters}
        locationInput={locationInput}
        onLocationChange={setLocationInput}
        onLocationSubmit={handleLocationSubmit}
        onUpdateFilter={updateFilter}
        onClearFilters={clearSidebarFilters}
      />
    </div>
  );
}
