"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { canonicalCategorySlug } from "@/lib/events/taxonomy";
import { EventsSearchBar, CategoryScrollList } from "./top-bar";

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

  const currentSearch = searchParams.get("search") ?? "";
  const currentCategory = searchParams.get("category") ?? "";
  const [searchInput, setSearchInput] = useState(currentSearch);

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

  const handleClearSearch = () => {
    setSearchInput("");
    updateQuery({ search: undefined });
  };

  const activeCategorySlug = currentCategory ? canonicalCategorySlug(currentCategory) : undefined;

  return (
    <div className="space-y-3.5">
      <EventsSearchBar
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        onSubmit={handleSearchSubmit}
        onClear={handleClearSearch}
        isPending={isPending}
      />

      <CategoryScrollList
        categories={categories}
        activeCategorySlug={activeCategorySlug}
        onSelectCategory={(slug) => updateQuery({ category: slug, type: undefined })}
      />
    </div>
  );
}
