"use client";

import { Search } from "lucide-react";

interface CertificatesFilterBarProps {
  filter: "all" | "eligible" | "pending";
  onFilterChange: (val: "all" | "eligible" | "pending") => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  totalCount: number;
  eligibleCount: number;
  pendingCount: number;
  locale?: "es" | "en";
}

export function CertificatesFilterBar({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  totalCount,
  eligibleCount,
  pendingCount,
  locale = "es",
}: CertificatesFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border w-fit">
        <button
          type="button"
          onClick={() => onFilterChange("all")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
            filter === "all"
              ? "bg-card text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {locale === "en" ? "All" : "Todos"} ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => onFilterChange("eligible")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
            filter === "eligible"
              ? "bg-emerald-600 text-white shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {locale === "en" ? "Ready" : "Disponibles"} ({eligibleCount})
        </button>
        <button
          type="button"
          onClick={() => onFilterChange("pending")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
            filter === "pending"
              ? "bg-amber-600 text-white shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {locale === "en" ? "Pending" : "Pendientes"} ({pendingCount})
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder={
            locale === "en" ? "Search certificate or event..." : "Buscar por evento o código..."
          }
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
        />
      </div>
    </div>
  );
}
