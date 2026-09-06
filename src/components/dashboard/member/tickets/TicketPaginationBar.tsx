"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface TicketPaginationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  locale?: "es" | "en";
  className?: string;
}

export function TicketPaginationBar({
  currentPage,
  totalPages,
  onPageChange,
  locale = "es",
  className = "",
}: TicketPaginationBarProps) {
  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex items-center justify-between border-t border-border/40 pt-3.5 text-[11px] font-bold text-foreground bg-card p-3 rounded-2xl border border-border/60 shadow-3xs select-none ${className}`}
    >
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted/40 transition disabled:opacity-40 disabled:hover:bg-background cursor-pointer select-none"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        <span>{locale === "en" ? "Prev" : "Ant"}</span>
      </button>

      <span className="text-muted-foreground font-extrabold tracking-wider">
        {currentPage} / {totalPages}
      </span>

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted/40 transition disabled:opacity-40 disabled:hover:bg-background cursor-pointer select-none"
      >
        <span>{locale === "en" ? "Next" : "Sig"}</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
