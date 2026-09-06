import { FileSpreadsheet, FileText, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportActionButtonsProps {
  loadingFormat: "pdf" | "excel" | "print" | null;
  labels: {
    exportExcel: string;
    exportPdf: string;
    print: string;
    exporting: string;
    printing: string;
  };
  onExport: (format: "pdf" | "excel" | "print") => void;
}

export function ExportActionButtons({
  loadingFormat,
  labels,
  onExport,
}: ExportActionButtonsProps) {
  return (
    <div className="flex items-center gap-2 mt-auto sm:ml-auto w-full sm:w-auto h-10 pt-2 sm:pt-0">
      <button
        onClick={() => onExport("excel")}
        disabled={loadingFormat !== null}
        className={cn(
          "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer",
          "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 dark:hover:bg-emerald-950/40"
        )}
      >
        <FileSpreadsheet className="h-4 w-4" />
        <span>{loadingFormat === "excel" ? labels.exporting : labels.exportExcel}</span>
      </button>
      <button
        onClick={() => onExport("pdf")}
        disabled={loadingFormat !== null}
        className={cn(
          "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer",
          "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/30 dark:hover:bg-violet-950/40"
        )}
      >
        <FileText className="h-4 w-4" />
        <span>{loadingFormat === "pdf" ? labels.exporting : labels.exportPdf}</span>
      </button>
      <button
        type="button"
        onClick={() => onExport("print")}
        disabled={loadingFormat !== null}
        className={cn(
          "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer",
          "bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30 dark:hover:bg-sky-950/40"
        )}
      >
        <Printer className="h-4 w-4" />
        <span>{loadingFormat === "print" ? labels.printing : labels.print}</span>
      </button>
    </div>
  );
}
