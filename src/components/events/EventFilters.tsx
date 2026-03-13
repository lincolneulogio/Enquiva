"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/components/providers/LocaleProvider";

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

  function applyFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams();
    if (currentFilters.search) params.set("search", currentFilters.search);
    if (currentFilters.category && key !== "category")
      params.set("category", currentFilters.category);
    if (value && key === "category") params.set("category", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          {t("events.filters.search")}
        </label>
        <input
          type="text"
          defaultValue={currentFilters.search}
          placeholder={t("events.filters.searchPlaceholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          onChange={(e) => {
            const params = new URLSearchParams();
            if (e.target.value) params.set("search", e.target.value);
            if (currentFilters.category) params.set("category", currentFilters.category);
            router.push(`${pathname}?${params.toString()}`);
          }}
        />
      </div>

      {/* Categories */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-foreground">{t("events.filters.category")}</h3>
        <div className="space-y-1">
          <button
            onClick={() => applyFilter("category", undefined)}
            className={cn(
              "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
              !currentFilters.category
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {t("events.filters.allCategories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => applyFilter("category", cat.slug)}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                currentFilters.category === cat.slug
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
