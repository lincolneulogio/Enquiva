import { Search, Download, Printer } from "lucide-react";

interface ManifestToolbarProps {
  search: string;
  setSearch: (value: string) => void;
  exportPDF: () => void;
  printPDF: () => void;
  hasBookings: boolean;
  busy: "pdf" | "print" | null;
  t: (key: string) => string;
}

export function ManifestToolbar({
  search,
  setSearch,
  exportPDF,
  printPDF,
  hasBookings,
  busy,
  t,
}: ManifestToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar pasajero, ruta o paradero..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-sm text-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={exportPDF}
          disabled={!hasBookings || busy !== null}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-xs transition-all hover:bg-accent/90 disabled:opacity-50 cursor-pointer"
        >
          <Download className="h-4 w-4" />
          {busy === "pdf" ? t("common.exporting") : "Descargar PDF"}
        </button>
        <button
          type="button"
          onClick={printPDF}
          disabled={!hasBookings || busy !== null}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-xs transition-all hover:bg-muted/50 disabled:opacity-50 cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          {busy === "print" ? t("common.printing") : t("common.print")}
        </button>
      </div>
    </div>
  );
}
