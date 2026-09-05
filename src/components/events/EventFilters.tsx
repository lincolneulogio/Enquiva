"use client";

import { useState, useTransition, useId } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Filter,
  SlidersHorizontal,
  X,
  RotateCcw,
  Calendar,
  MapPin,
  CreditCard,
  Tag,
  Globe,
  Ticket,
  Check,
  Clock3,
  Laptop,
  Shuffle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import {
  MODALITY_OPTIONS,
  DATE_FILTER_OPTIONS,
  PRICE_FILTER_OPTIONS,
  ACCESS_TYPE_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "@/lib/events/taxonomy";

export interface EventFiltersState {
  category?: string;
  type?: string;
  modality?: string;
  date?: string;
  price?: string;
  accessType?: string;
  eventStatus?: string;
  search?: string;
  location?: string;
}

export interface CategoryOption {
  slug: string;
  label: string;
  colorClass?: string | null;
}

interface EventFiltersProps {
  currentFilters: EventFiltersState;
  categories?: CategoryOption[];
  totalEvents?: number;
  className?: string;
  sidebarOnly?: boolean;
}

export function EventFilters({
  currentFilters,
  totalEvents,
  className,
}: EventFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const { locale } = useLocale();
  const [isPending, startTransition] = useTransition();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [locationInput, setLocationInput] = useState(currentFilters.location ?? "");
  const locationInputId = useId();

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

      {/* Panel lateral Desktop (Sin categorías, solo filtros estructurados) */}
      <aside className="hidden rounded-3xl border border-border/80 bg-card p-5 shadow-xs lg:block">
        {/* Cabecera con Limpiar */}
        <div className="mb-5 flex items-center justify-between border-b border-border/70 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Filter className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Filtros
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {totalEvents != null ? `${totalEvents} eventos encontrados` : "Personaliza tu búsqueda"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearSidebarFilters}
            className="text-xs font-semibold text-primary transition hover:underline cursor-pointer"
          >
            Limpiar
          </button>
        </div>

        <div className="space-y-6">
          {/* 1. FECHA */}
          <div>
            <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>FECHA</span>
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {DATE_FILTER_OPTIONS.map((opt) => {
                const isSelected = (currentFilters.date ?? "all") === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateFilter({ date: opt.value === "all" ? undefined : opt.value })}
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
              <span>MODALIDAD</span>
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {MODALITY_OPTIONS.map((opt) => {
                const isSelected = (currentFilters.modality ?? "all") === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateFilter({ modality: opt.value === "all" ? undefined : opt.value })}
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
              <span>PRECIO</span>
            </h3>
            <div className="grid grid-cols-3 gap-1.5">
              {PRICE_FILTER_OPTIONS.map((opt) => {
                const isSelected = (currentFilters.price ?? "all") === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateFilter({ price: opt.value === "all" ? undefined : opt.value })}
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
              <span>TIPO DE ACCESO</span>
            </h3>
            <div className="space-y-1">
              {ACCESS_TYPE_OPTIONS.map((opt) => {
                const isSelected = (currentFilters.accessType ?? "all") === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateFilter({ accessType: opt.value === "all" ? undefined : opt.value })}
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
              <span>ESTADO</span>
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {STATUS_FILTER_OPTIONS.map((opt) => {
                const isSelected = (currentFilters.eventStatus ?? "all") === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateFilter({ eventStatus: opt.value === "all" ? undefined : opt.value })}
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
              <span>UBICACIÓN / CIUDAD</span>
            </h3>
            <form onSubmit={handleLocationSubmit} className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                id={locationInputId}
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Ej. Huánuco, Lima..."
                className="w-full rounded-xl border border-border/80 bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-xs lg:hidden">
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col bg-background p-6 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <h3 className="text-base font-bold text-foreground">Filtros</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-6">
              {/* FECHA */}
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span>Fecha</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {DATE_FILTER_OPTIONS.map((opt) => {
                    const isSelected = (currentFilters.date ?? "all") === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          updateFilter({ date: opt.value === "all" ? undefined : opt.value });
                          setMobileDrawerOpen(false);
                        }}
                        className={cn(
                          "rounded-xl px-2.5 py-1.5 text-xs font-medium cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "border border-border/70 bg-card text-muted-foreground"
                        )}
                      >
                        {locale === "en" ? opt.labelEn : opt.labelEs}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MODALIDAD */}
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                  <span>Modalidad</span>
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {MODALITY_OPTIONS.map((opt) => {
                    const isSelected = (currentFilters.modality ?? "all") === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          updateFilter({ modality: opt.value === "all" ? undefined : opt.value });
                          setMobileDrawerOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-center cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "border border-border/70 bg-card text-muted-foreground"
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

              {/* PRECIO */}
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
                  <CreditCard className="h-3.5 w-3.5 text-primary" />
                  <span>Precio</span>
                </h4>
                <div className="grid grid-cols-3 gap-1.5">
                  {PRICE_FILTER_OPTIONS.map((opt) => {
                    const isSelected = (currentFilters.price ?? "all") === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          updateFilter({ price: opt.value === "all" ? undefined : opt.value });
                          setMobileDrawerOpen(false);
                        }}
                        className={cn(
                          "rounded-xl px-2 py-1.5 text-xs font-medium text-center cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "border border-border/70 bg-card text-muted-foreground"
                        )}
                      >
                        {locale === "en" ? opt.labelEn : opt.labelEs}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ESTADO */}
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5 text-primary" />
                  <span>Estado</span>
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {STATUS_FILTER_OPTIONS.map((opt) => {
                    const isSelected = (currentFilters.eventStatus ?? "all") === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          updateFilter({ eventStatus: opt.value === "all" ? undefined : opt.value });
                          setMobileDrawerOpen(false);
                        }}
                        className={cn(
                          "rounded-xl px-2.5 py-1.5 text-xs font-medium text-center cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "border border-border/70 bg-card text-muted-foreground"
                        )}
                      >
                        {locale === "en" ? opt.labelEn : opt.labelEs}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* UBICACIÓN */}
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>Ubicación</span>
                </h4>
                <form
                  onSubmit={(e) => {
                    handleLocationSubmit(e);
                    setMobileDrawerOpen(false);
                  }}
                  className="relative"
                >
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="Ej. Huánuco, Lima..."
                    className="w-full rounded-xl border border-border/80 bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground"
                  />
                </form>
              </div>

              {/* Limpiar */}
              <button
                type="button"
                onClick={() => {
                  clearSidebarFilters();
                  setMobileDrawerOpen(false);
                }}
                className="w-full rounded-xl bg-muted py-2.5 text-xs font-bold text-foreground hover:bg-muted/80 cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

