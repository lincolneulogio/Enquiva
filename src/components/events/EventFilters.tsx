"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const categories = [
  "worship", "retreat", "youth", "charity", "conference",
  "prayer", "bible_study", "outreach", "fellowship", "other",
] as const;

function categoryLabel(cat: string): string {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface EventFiltersProps {
  currentFilters: {
    category?: string;
    search?: string;
  };
}

export function EventFilters({ currentFilters }: EventFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

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
          Search
        </label>
        <input
          type="text"
          defaultValue={currentFilters.search}
          placeholder="Search events..."
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
        <h3 className="mb-3 text-sm font-medium text-foreground">Category</h3>
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
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => applyFilter("category", cat)}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                currentFilters.category === cat
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {categoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
