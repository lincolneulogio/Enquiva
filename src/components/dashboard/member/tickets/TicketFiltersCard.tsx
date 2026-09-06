"use client";

import { Search } from "lucide-react";

interface TicketFiltersCardProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  activeTab: "all" | "upcoming" | "past";
  onTabChange: (tab: "all" | "upcoming" | "past") => void;
  totalCount: number;
  locale?: "es" | "en";
}

export function TicketFiltersCard({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  totalCount,
  locale = "es",
}: TicketFiltersCardProps) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-card border border-border/80 shadow-3xs">
      <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
        {locale === "en" ? "Search & Filters" : "Búsqueda y Filtros"}
      </span>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder={locale === "en" ? "Search events..." : "Buscar eventos..."}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      {/* Tab Selector */}
      <div className="flex p-1 bg-muted/65 rounded-xl border border-border/80 text-[11px] font-bold">
        <button
          type="button"
          onClick={() => onTabChange("all")}
          className={`flex-1 py-1.5 rounded-lg transition-all duration-200 select-none cursor-pointer ${
            activeTab === "all"
              ? "bg-background text-primary shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {locale === "en" ? "All" : "Todas"} ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => onTabChange("upcoming")}
          className={`flex-1 py-1.5 rounded-lg transition-all duration-200 select-none cursor-pointer ${
            activeTab === "upcoming"
              ? "bg-background text-primary shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {locale === "en" ? "Upcoming" : "Próximas"}
        </button>
        <button
          type="button"
          onClick={() => onTabChange("past")}
          className={`flex-1 py-1.5 rounded-lg transition-all duration-200 select-none cursor-pointer ${
            activeTab === "past"
              ? "bg-background text-primary shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {locale === "en" ? "Past" : "Pasadas"}
        </button>
      </div>
    </div>
  );
}
