import { Search, Download, Send } from "lucide-react";
import type { NewsletterStats } from "@/actions/admin/newsletter";
import type { StatusFilter } from "./types";

interface NewsletterControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
  stats: NewsletterStats;
  isPending: boolean;
  onExportCsv: () => void;
  onOpenBroadcastModal: () => void;
}

export function NewsletterControls({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  stats,
  isPending,
  onExportCsv,
  onOpenBroadcastModal,
}: NewsletterControlsProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por correo electrónico..."
            className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center rounded-xl border border-border bg-muted/40 p-1 text-xs">
          <button
            type="button"
            onClick={() => onStatusFilterChange("all")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange("active")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === "active"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Activos ({stats.active})
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange("unsubscribed")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === "unsubscribed"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Bajas ({stats.unsubscribed})
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExportCsv}
          disabled={isPending || stats.total === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4 text-muted-foreground" />
          Exportar CSV
        </button>
        <button
          type="button"
          onClick={onOpenBroadcastModal}
          disabled={stats.active === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Redactar Comunicado
        </button>
      </div>
    </div>
  );
}
