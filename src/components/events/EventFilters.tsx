"use client";

import { useRouter, usePathname } from "next/navigation";
import { Filter, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { categoryLabel } from "@/lib/utils";

interface CategoryOption {
  slug: string;
  label: string;
  colorClass?: string;
}

interface EventFiltersProps {
  currentFilters: {
    category?: string;
    search?: string;
  };
  categories: CategoryOption[];
}

export function EventFilters({ currentFilters, categories }: EventFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const { locale } = useLocale();

  function applyFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams();
    if (currentFilters.search) params.set("search", currentFilters.search);
    if (currentFilters.category && key !== "category")
      params.set("category", currentFilters.category);
    if (value && key === "category") params.set("category", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-xs lg:sticky lg:top-6">
      <div className="mb-5 flex items-center gap-2 border-b border-border pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Filter className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {t("events.filters.title")}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {t("events.filters.search")} · {t("events.filters.category")}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="events-sidebar-search" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("events.filters.search")}
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="events-sidebar-search"
              type="text"
              defaultValue={currentFilters.search}
              placeholder={t("events.filters.searchPlaceholder")}
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              onChange={(e) => {
                const params = new URLSearchParams();
                if (e.target.value) params.set("search", e.target.value);
                if (currentFilters.category) params.set("category", currentFilters.category);
                router.push(`${pathname}?${params.toString()}`);
              }}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("events.filters.category")}
          </h3>
          <div className="space-y-1 rounded-2xl border border-border/70 bg-muted/40 p-1.5">
            <button
              type="button"
              onClick={() => applyFilter("category", undefined)}
              className={cn(
                "w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors",
                !currentFilters.category
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-background hover:text-foreground",
              )}
            >
              {t("events.filters.allCategories")}
            </button>
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.slug}
                onClick={() => applyFilter("category", cat.slug)}
                className={cn(
                  "w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors",
                  currentFilters.category === cat.slug
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-background hover:text-foreground",
                )}
              >
                {categoryLabel(cat.slug, locale)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
