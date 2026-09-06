"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { canonicalCategorySlug } from "@/lib/events/taxonomy";
import { CategoryIcon } from "@/components/events/CategoryIcon";
import type { CategoryOption } from "@/components/events/EventsTopFilterBar";

interface CategoryScrollListProps {
  categories: CategoryOption[];
  activeCategorySlug?: string;
  onSelectCategory: (slug?: string) => void;
}

export function CategoryScrollList({
  categories,
  activeCategorySlug,
  onSelectCategory,
}: CategoryScrollListProps) {
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

  return (
    <div className="relative group flex items-center">
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

      <div
        ref={scrollRef}
        onWheel={handleWheel}
        className="flex items-center gap-2 overflow-x-auto scroll-smooth py-1 scrollbar-none"
      >
        <button
          type="button"
          onClick={() => onSelectCategory(undefined)}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all cursor-pointer",
            !activeCategorySlug
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "border border-border/80 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          <Folder
            className={cn(
              "h-4 w-4 shrink-0 transition-transform",
              !activeCategorySlug ? "text-primary-foreground" : "text-primary",
            )}
          />
          <span>Todas las categorías</span>
        </button>

        {categories.map((cat) => {
          const isSelected = activeCategorySlug === canonicalCategorySlug(cat.slug);
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => onSelectCategory(isSelected ? undefined : cat.slug)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium transition-all cursor-pointer",
                isSelected
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "border border-border/80 bg-card text-neutral-800 dark:text-neutral-200 hover:border-primary/40 hover:text-foreground",
              )}
            >
              <CategoryIcon
                slug={cat.slug}
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform",
                  isSelected ? "text-primary-foreground" : "text-primary",
                )}
              />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

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
  );
}
