"use client";

import { useState, useTransition, useId } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  RotateCcw,
  Calendar,
  MapPin,
  CreditCard,
  Tag,
  ChevronDown,
  Globe,
  Video,
  Laptop,
  Check,
  Building2,
  Ticket,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import { CategoryIcon } from "@/components/events/CategoryIcon";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import {
  EVENT_CATEGORIES,
  FEATURED_CATEGORY_SLUGS,
  MODALITY_OPTIONS,
  DATE_FILTER_OPTIONS,
  PRICE_FILTER_OPTIONS,
  ACCESS_TYPE_OPTIONS,
  STATUS_FILTER_OPTIONS,
  canonicalCategorySlug,
  getCategoryDefinition,
  getTypesForCategory,
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
  categories: CategoryOption[];
  totalEvents?: number;
  className?: string;
}

export function EventFilters({
  currentFilters,
  categories,
  totalEvents,
  className,
}: EventFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const { locale } = useLocale();
  const [isPending, startTransition] = useTransition();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [moreCategoriesOpen, setMoreCategoriesOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(currentFilters.search ?? "");
  const [locationInput, setLocationInput] = useState(currentFilters.location ?? "");
  const [typesExpanded, setTypesExpanded] = useState(false);

  const searchInputId = useId();
  const locationInputId = useId();

  // Combina categorías registradas en BD con la taxonomía oficial de 18
  const allCategorySlugs = new Set<string>();
  EVENT_CATEGORIES.forEach((c) => allCategorySlugs.add(c.slug));
  categories.forEach((c) => allCategorySlugs.add(c.slug));

  const activeCategory = currentFilters.category ? canonicalCategorySlug(currentFilters.category) : undefined;
  const activeCategoryDef = activeCategory ? getCategoryDefinition(activeCategory) : undefined;
  const availableTypes = getTypesForCategory(activeCategory);

  // Lista destacada de categorías para pills
  const featuredCategories = FEATURED_CATEGORY_SLUGS.map((slug) => getCategoryDefinition(slug)).filter(
    (c): c is NonNullable<typeof c> => c != null
  );

  // Categorías restantes para el menú "Más categorías ▾"
  const moreCategories = EVENT_CATEGORIES.filter(
    (c) => !FEATURED_CATEGORY_SLUGS.includes(c.slug)
  );

  function updateFilter(updates: Partial<Record<keyof EventFiltersState, string | undefined>>) {
    const params = new URLSearchParams();

    const merged: EventFiltersState = {
      ...currentFilters,
      ...updates,
    };

    // Resetear a página 1 cuando cambia cualquier filtro
    Object.entries(merged).forEach(([key, val]) => {
      if (val && val !== "all" && val.trim() !== "") {
        params.set(key, val.trim());
      }
    });

    startTransition(() => {
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  }

  function clearAllFilters() {
    setSearchInput("");
    setLocationInput("");
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateFilter({ search: searchInput || undefined });
  }

  function handleLocationSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateFilter({ location: locationInput || undefined });
  }

  // Contar cuántos filtros secundarios están activos (excluyendo "all")
  const activeFiltersCount = [
    currentFilters.category && currentFilters.category !== "all",
    currentFilters.type && currentFilters.type !== "all",
    currentFilters.modality && currentFilters.modality !== "all",
    currentFilters.date && currentFilters.date !== "all",
    currentFilters.price && currentFilters.price !== "all",
    currentFilters.accessType && currentFilters.accessType !== "all",
    currentFilters.eventStatus && currentFilters.eventStatus !== "all",
    currentFilters.search && currentFilters.search.trim() !== "",
    currentFilters.location && currentFilters.location.trim() !== "",
  ].filter(Boolean).length;

  return (
    <div className={cn("space-y-6", className)}>
      {/* 1. Barra de Búsqueda Principal Superior */}
      <div className="relative rounded-3xl border border-border/80 bg-card/80 p-3 shadow-xs backdrop-blur-sm sm:p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor={searchInputId} className="sr-only">
              {t("events.filters.searchLabel") || "Buscar eventos"}
            </label>
            <input
              id={searchInputId}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("events.filters.searchPlaceholder") || "Congreso, concierto, taller, tecnología..."}
              className="w-full rounded-2xl border border-border/80 bg-background/90 py-2.5 pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  updateFilter({ search: undefined });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              <span>{t("events.filters.search") || "Buscar"}</span>
            </button>

            {/* Botón trigger para móvil */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="relative inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground shadow-xs transition hover:bg-muted lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <span>{t("events.filters.openFilters") || "Filtros"}</span>
              {activeFiltersCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Categorías en Pills Horizontales (Desktop & Tablet) */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Opción "Todas" */}
          <button
            type="button"
            onClick={() => updateFilter({ category: undefined, type: undefined })}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all sm:text-sm",
              !activeCategory
                ? "bg-primary text-primary-foreground shadow-xs ring-1 ring-primary"
                : "border border-border/80 bg-card text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>{t("events.filters.allCategories") || "Todas"}</span>
          </button>

          {/* Categorías Principales */}
          {featuredCategories.map((cat) => {
            const isSelected = activeCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() =>
                  updateFilter({
                    category: isSelected ? undefined : cat.slug,
                    type: undefined,
                  })
                }
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all sm:text-sm",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs ring-1 ring-primary"
                    : "border border-border/80 bg-card text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <CategoryIcon slug={cat.slug} className="h-4 w-4 shrink-0" />
                <span>{locale === "en" ? cat.shortLabelEn : cat.shortLabelEs}</span>
              </button>
            );
          })}

          {/* Desplegable "Más categorías ▾" */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreCategoriesOpen((prev) => !prev)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all sm:text-sm",
                moreCategories.some((c) => c.slug === activeCategory)
                  ? "bg-primary text-primary-foreground shadow-xs ring-1 ring-primary"
                  : "border border-border/80 bg-card text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {activeCategory && moreCategories.some((c) => c.slug === activeCategory) ? (
                <CategoryIcon slug={activeCategory} className="h-4 w-4 shrink-0" />
              ) : (
                <LayoutGrid className="h-4 w-4 shrink-0 opacity-80" />
              )}
              <span>
                {moreCategories.find((c) => c.slug === activeCategory)
                  ? locale === "en"
                    ? moreCategories.find((c) => c.slug === activeCategory)?.shortLabelEn
                    : moreCategories.find((c) => c.slug === activeCategory)?.shortLabelEs
                  : t("events.filters.moreCategories") || "Más categorías"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>

            {moreCategoriesOpen && (
              <div
                role="dialog"
                aria-label="Más categorías"
                className="absolute left-0 top-[calc(100%+0.5rem)] z-40 max-h-80 w-64 overflow-y-auto rounded-2xl border border-border bg-popover p-2 shadow-xl"
              >
                <div className="space-y-1">
                  {moreCategories.map((cat) => {
                    const isSelected = activeCategory === cat.slug;
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => {
                          updateFilter({
                            category: isSelected ? undefined : cat.slug,
                            type: undefined,
                          });
                          setMoreCategoriesOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors sm:text-sm",
                          isSelected
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "text-popover-foreground hover:bg-muted"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <CategoryIcon slug={cat.slug} className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span>{locale === "en" ? cat.labelEn : cat.labelEs}</span>
                        </span>
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subtipos de la categoría activa */}
        {activeCategoryDef && availableTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("events.filters.eventType") || "Tipo"}:
            </span>
            <button
              type="button"
              onClick={() => updateFilter({ type: undefined })}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                !currentFilters.type
                  ? "bg-foreground/10 text-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {t("events.filters.allTypes") || "Todos"}
            </button>
            {availableTypes.slice(0, typesExpanded ? undefined : 6).map((typeOpt) => {
              const isTypeSelected = currentFilters.type === typeOpt.slug;
              return (
                <button
                  key={typeOpt.slug}
                  type="button"
                  onClick={() => updateFilter({ type: isTypeSelected ? undefined : typeOpt.slug })}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                    isTypeSelected
                      ? "bg-primary/20 text-primary font-semibold ring-1 ring-primary/40"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {typeOpt.label}
                </button>
              );
            })}
            {availableTypes.length > 6 && (
              <button
                type="button"
                onClick={() => setTypesExpanded((prev) => !prev)}
                className="text-xs font-medium text-primary hover:underline"
              >
                {typesExpanded ? "Ver menos" : `+${availableTypes.length - 6} más`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Badges de Filtros Activos */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-muted/30 p-2.5">
          <span className="text-xs font-semibold text-muted-foreground">
            {t("events.filters.activeFilters") || "Filtros activos"}:
          </span>

          {currentFilters.search && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs">
              <Search className="h-3 w-3 text-muted-foreground" />
              <span>&ldquo;{currentFilters.search}&rdquo;</span>
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  updateFilter({ search: undefined });
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {activeCategoryDef && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs">
              <CategoryIcon slug={activeCategoryDef.slug} className="h-3 w-3 text-muted-foreground shrink-0" />
              <span>{locale === "en" ? activeCategoryDef.shortLabelEn : activeCategoryDef.shortLabelEs}</span>
              <button
                type="button"
                onClick={() => updateFilter({ category: undefined, type: undefined })}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {currentFilters.type && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs">
              <Tag className="h-3 w-3 text-muted-foreground" />
              <span>{currentFilters.type}</span>
              <button
                type="button"
                onClick={() => updateFilter({ type: undefined })}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {currentFilters.modality && currentFilters.modality !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs">
              <Globe className="h-3 w-3 text-muted-foreground" />
              <span>
                {MODALITY_OPTIONS.find((m) => m.value === currentFilters.modality)?.[
                  locale === "en" ? "labelEn" : "labelEs"
                ]}
              </span>
              <button
                type="button"
                onClick={() => updateFilter({ modality: undefined })}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {currentFilters.date && currentFilters.date !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span>
                {DATE_FILTER_OPTIONS.find((d) => d.value === currentFilters.date)?.[
                  locale === "en" ? "labelEn" : "labelEs"
                ]}
              </span>
              <button
                type="button"
                onClick={() => updateFilter({ date: undefined })}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {currentFilters.price && currentFilters.price !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs">
              <CreditCard className="h-3 w-3 text-muted-foreground" />
              <span>
                {PRICE_FILTER_OPTIONS.find((p) => p.value === currentFilters.price)?.[
                  locale === "en" ? "labelEn" : "labelEs"
                ]}
              </span>
              <button
                type="button"
                onClick={() => updateFilter({ price: undefined })}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {currentFilters.accessType && currentFilters.accessType !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs">
              <Ticket className="h-3 w-3 text-muted-foreground shrink-0" />
              <span>
                {ACCESS_TYPE_OPTIONS.find((a) => a.value === currentFilters.accessType)?.[
                  locale === "en" ? "labelEn" : "labelEs"
                ]}
              </span>
              <button
                type="button"
                onClick={() => updateFilter({ accessType: undefined })}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {currentFilters.eventStatus && currentFilters.eventStatus !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs">
              <Tag className="h-3 w-3 text-muted-foreground" />
              <span>
                {STATUS_FILTER_OPTIONS.find((s) => s.value === currentFilters.eventStatus)?.[
                  locale === "en" ? "labelEn" : "labelEs"
                ]}
              </span>
              <button
                type="button"
                onClick={() => updateFilter({ eventStatus: undefined })}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {currentFilters.location && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span>{currentFilters.location}</span>
              <button
                type="button"
                onClick={() => {
                  setLocationInput("");
                  updateFilter({ location: undefined });
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={clearAllFilters}
            className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
          >
            <RotateCcw className="h-3 w-3" />
            <span>{t("events.filters.clearFilters") || "Limpiar filtros"}</span>
          </button>
        </div>
      )}

      {/* 4. Panel lateral Desktop con los filtros estructurados */}
      <aside className="rounded-3xl border border-border bg-card p-5 shadow-xs">
        <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Filter className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {t("events.filters.title") || "Filtros"}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {totalEvents != null ? t("events.filters.eventsFound", { count: totalEvents }) : "Personaliza tu búsqueda"}
              </p>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              title="Restablecer filtros"
              className="text-xs font-medium text-muted-foreground transition hover:text-destructive"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* 📅 Fecha */}
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{t("events.filters.date") || "Fecha"}</span>
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {DATE_FILTER_OPTIONS.map((opt) => {
                const isSelected = (currentFilters.date ?? "all") === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateFilter({ date: opt.value === "all" ? undefined : opt.value })}
                    className={cn(
                      "rounded-xl px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                  >
                    {locale === "en" ? opt.labelEn : opt.labelEs}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 🖥️ Modalidad */}
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Laptop className="h-3.5 w-3.5 text-primary" />
              <span>{t("events.filters.modality") || "Modalidad"}</span>
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
                      "flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                  >
                    {opt.value === "in_person" && <MapPin className="h-3 w-3" />}
                    {opt.value === "online" && <Video className="h-3 w-3" />}
                    {opt.value === "hybrid" && <Laptop className="h-3 w-3" />}
                    {opt.value === "all" && <Globe className="h-3 w-3" />}
                    <span>{locale === "en" ? opt.labelEn : opt.labelEs}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 💰 Precio */}
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              <span>{t("events.filters.price") || "Precio"}</span>
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
                      "rounded-xl px-2.5 py-1.5 text-center text-xs font-medium transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                  >
                    {locale === "en" ? opt.labelEn : opt.labelEs}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tipo de Acceso */}
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Ticket className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{t("events.filters.accessType") || "Tipo de acceso"}</span>
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
                      "flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-xs font-medium transition-colors",
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

          {/* 🏷️ Estado */}
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Tag className="h-3.5 w-3.5 text-primary" />
              <span>{t("events.filters.status") || "Estado"}</span>
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
                      "rounded-xl px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                  >
                    {locale === "en" ? opt.labelEn : opt.labelEs}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 📍 Ubicación / Ciudad */}
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>{t("events.filters.location") || "Ubicación"}</span>
            </h3>
            <form onSubmit={handleLocationSubmit} className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <label htmlFor={locationInputId} className="sr-only">
                {t("events.filters.location") || "Ubicación"}
              </label>
              <input
                id={locationInputId}
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder={t("events.filters.locationPlaceholder") || "Ej. Huánuco..."}
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </form>
          </div>
        </div>
      </aside>

      {/* 5. Mobile Drawer Modal para Filtros Completos */}
      {mobileDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filtros de eventos"
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs lg:hidden"
        >
          <div
            className="flex max-h-[90vh] w-full flex-col rounded-t-3xl border-t border-border bg-card p-6 shadow-2xl overflow-y-auto"
          >
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                <h2 className="text-base font-bold text-foreground">
                  {t("events.filters.title") || "Filtros"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Modalidad */}
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                  {t("events.filters.modality") || "Modalidad"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {MODALITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateFilter({ modality: opt.value === "all" ? undefined : opt.value })}
                      className={cn(
                        "rounded-xl py-2 px-3 text-xs font-medium text-center",
                        (currentFilters.modality ?? "all") === opt.value
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {locale === "en" ? opt.labelEn : opt.labelEs}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fecha */}
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                  {t("events.filters.date") || "Fecha"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DATE_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateFilter({ date: opt.value === "all" ? undefined : opt.value })}
                      className={cn(
                        "rounded-xl py-2 px-3 text-xs font-medium text-center",
                        (currentFilters.date ?? "all") === opt.value
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {locale === "en" ? opt.labelEn : opt.labelEs}
                    </button>
                  ))}
                </div>
              </div>

              {/* Precio */}
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                  {t("events.filters.price") || "Precio"}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {PRICE_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateFilter({ price: opt.value === "all" ? undefined : opt.value })}
                      className={cn(
                        "rounded-xl py-2 px-3 text-xs font-medium text-center",
                        (currentFilters.price ?? "all") === opt.value
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {locale === "en" ? opt.labelEn : opt.labelEs}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estado */}
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase">
                  {t("events.filters.status") || "Estado"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateFilter({ eventStatus: opt.value === "all" ? undefined : opt.value })}
                      className={cn(
                        "rounded-xl py-2 px-3 text-xs font-medium text-center",
                        (currentFilters.eventStatus ?? "all") === opt.value
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {locale === "en" ? opt.labelEn : opt.labelEs}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer de acción */}
            <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => {
                  clearAllFilters();
                  setMobileDrawerOpen(false);
                }}
                className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground hover:bg-muted"
              >
                {t("events.filters.clearFilters") || "Limpiar"}
              </button>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex-1 rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
              >
                {t("events.filters.applyFilters") || "Ver eventos"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
