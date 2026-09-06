"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface EventsSearchBarProps {
  searchInput: string;
  setSearchInput: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClear: () => void;
  isPending: boolean;
}

export function EventsSearchBar({
  searchInput,
  setSearchInput,
  onSubmit,
  onClear,
  isPending,
}: EventsSearchBarProps) {
  return (
    <form
      onSubmit={onSubmit}
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
            onClick={onClear}
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
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 active:scale-98 disabled:opacity-50 cursor-pointer"
      >
        <Search className="h-4 w-4" />
        <span>Buscar</span>
      </button>
    </form>
  );
}
