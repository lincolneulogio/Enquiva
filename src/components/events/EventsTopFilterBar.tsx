"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, ChevronLeft, ChevronRight, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { canonicalCategorySlug } from "@/lib/events/taxonomy";
import { CategoryIcon } from "@/components/events/CategoryIcon";

export interface CategoryOption {
  slug: string;
  label: string;
  colorClass?: string | null;
}

interface EventsTopFilterBarProps {
  categories?: CategoryOption[];
}

export function EventsTopFilterBar({ categories = [] }: EventsTopFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Categorías provistas directamente desde la base de datos
  const displayCategories = categories;


  const currentSearch = searchParams.get("search") ?? "";
  const currentCategory = searchParams.get("category") ?? "";
  const [searchInput, setSearchInput] = useState(currentSearch);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
    }
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", updateScrollState, { passive: true });
      window.addEventListener("resize", updateScrollState);
      return () => {
        el.removeEventListener("scroll", updateScrollState);
        window.removeEventListener("resize", updateScrollState);
      };
    }
  }, [updateScrollState]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      scrollRef.current.scrollBy({
        left: e.deltaY * 1.5,
        behavior: "smooth",
      });
    }
  };

  function updateQuery(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val && val.trim() !== "" && val !== "all") {
        params.set(key, val.trim());
      } else {
        params.delete(key);
      }
    });
    params.delete("page");

    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ search: searchInput || undefined });
  };

  const activeCategorySlug = currentCategory ? canonicalCategorySlug(currentCategory) : undefined;

  return (
    <div className="space-y-3.5">
      {/* 1. Barra de Búsqueda Grande con Botón Naranja */}
      <form
        onSubmit={handleSearchSubmit}
        className="relative flex items-center rounded-2xl border border-border/80 bg-card p-1.5 shadow-xs transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20"
      >
        <div className="relative flex flex-1 items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Congreso, tecnología, diseño, negocios..."
            className="w-full bg-transparent py-2.5 pl-10 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateQuery({ search: undefined });
              }}
              className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF5500] px-6 py-2.5 text-sm font-bold text-white shadow-xs transition-all hover:bg-[#E04B00] active:scale-98 disabled:opacity-50 cursor-pointer"
        >
          <Search className="h-4 w-4" />
          <span>Buscar</span>
        </button>
      </form>

      {/* 2. Fila Desplazable de Categorías con Iconos Vectoriales de Lucide y Scroll Horizontal */}
      <div className="relative group flex items-center">
        {/* Gradiente y Botón Flecha Izquierda */}
        {canScrollLeft && (
          <div className="absolute left-0 z-20 flex h-full items-center bg-gradient-to-r from-background via-background/90 to-transparent pr-4">
            <button
              type="button"
              onClick={() => handleScroll("left")}
              aria-label="Desplazar a la izquierda"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border/90 bg-card text-foreground shadow-md transition-all hover:scale-110 hover:bg-muted active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Contenedor con scroll horizontal suave, touch y rueda del mouse */}
        <div
          ref={scrollRef}
          onWheel={handleWheel}
          className="flex items-center gap-2 overflow-x-auto scroll-smooth py-1 scrollbar-none"
        >
          {/* Opción "Todas las categorías" con icono Folder vectorial */}
          <button
            type="button"
            onClick={() => updateQuery({ category: undefined, type: undefined })}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all cursor-pointer",
              !activeCategorySlug
                ? "bg-[#FF5500] text-white shadow-xs font-bold"
                : "border border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            <Folder
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                !activeCategorySlug ? "text-white" : "text-[#FF5500]"
              )}
            />
            <span>Todas las categorías</span>
          </button>

          {/* Categorías con sus respectivos iconos vectoriales de Lucide desde la BD */}
          {displayCategories.map((cat) => {
            const isSelected = activeCategorySlug === canonicalCategorySlug(cat.slug);
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => updateQuery({ category: isSelected ? undefined : cat.slug, type: undefined })}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium transition-all cursor-pointer",
                  isSelected
                    ? "bg-[#FF5500] text-white font-bold shadow-xs"
                    : "border border-border/80 bg-card text-neutral-800 dark:text-neutral-200 hover:border-primary/40 hover:text-foreground"
                )}
              >
                <CategoryIcon
                  slug={cat.slug}
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform",
                    isSelected ? "text-white" : "text-[#FF5500]"
                  )}
                />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Gradiente y Botón Flecha Derecha */}
        {canScrollRight && (
          <div className="absolute right-0 z-20 flex h-full items-center bg-gradient-to-l from-background via-background/90 to-transparent pl-4">
            <button
              type="button"
              onClick={() => handleScroll("right")}
              aria-label="Desplazar a la derecha"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border/90 bg-card text-foreground shadow-md transition-all hover:scale-110 hover:bg-muted active:scale-95 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

