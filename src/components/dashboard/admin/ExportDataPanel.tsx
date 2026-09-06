"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Download, Filter } from "lucide-react";
import { toast } from "sonner";
import {
  getExportData,
  type ExportCategoryOption,
  type ExportEventOption,
  type ExportResource,
  type ExportScope,
} from "@/actions/exports";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { printJsPdf } from "@/lib/export/print-pdf";
import { cn } from "@/lib/utils";
import {
  downloadExcel,
  buildExportPdf,
  ExportFilterControls,
  ExportActionButtons,
  type StatusOption,
} from "./export";

interface ExportDataPanelProps {
  resource: ExportResource;
  scope: ExportScope;
  eventOptions?: ExportEventOption[];
  categoryOptions?: ExportCategoryOption[];
  statusOptions?: StatusOption[];
  initialStatus?: string;
  initialCategory?: string;
  enableDateRange?: boolean;
  showExportActions?: boolean;
  className?: string;
}

export function ExportDataPanel({
  resource,
  scope,
  eventOptions = [],
  categoryOptions = [],
  statusOptions,
  initialStatus = "all",
  initialCategory = "",
  enableDateRange = true,
  showExportActions = true,
  className,
}: ExportDataPanelProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const eventId = searchParams.get("eventId") || "";
  const status = searchParams.get("status") || initialStatus;
  const category = searchParams.get("category") || initialCategory;
  const fromDate = searchParams.get("fromDate") || "";
  const toDate = searchParams.get("toDate") || "";
  const [loadingFormat, setLoadingFormat] = useState<"pdf" | "excel" | "print" | null>(null);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const hasAnyFilter =
    eventOptions.length > 0 ||
    Boolean(statusOptions?.length) ||
    categoryOptions.length > 0 ||
    enableDateRange;

  const helperText = useMemo(() => {
    if (resource === "payments") {
      return locale === "en"
        ? "For high-volume data, Excel is usually the best option."
        : "Para volúmenes altos, Excel suele ser la mejor opción.";
    }
    return locale === "en"
      ? "PDF auto-splits across pages; Excel works better for massive exports."
      : "El PDF se parte automáticamente en varias páginas; Excel funciona mejor para volúmenes masivos.";
  }, [locale, resource]);

  const handleExport = async (format: "pdf" | "excel" | "print") => {
    try {
      setLoadingFormat(format);
      const payload = await getExportData({
        resource,
        scope,
        eventId: eventId || null,
        status: statusOptions?.length ? status : null,
        category: categoryOptions.length > 0 ? category || null : null,
        fromDate: enableDateRange && fromDate ? fromDate : null,
        toDate: enableDateRange && toDate ? toDate : null,
      });

      if (format === "excel") {
        await downloadExcel(payload);
      } else {
        const doc = await buildExportPdf(payload);
        if (format === "print") {
          await printJsPdf(doc);
        } else {
          doc.save(`${payload.suggestedFileName}.pdf`);
        }
      }

      toast.success(
        format === "print"
          ? t("common.printOpened")
          : locale === "en"
            ? `${format.toUpperCase()} export generated successfully`
            : `Exportación ${format.toUpperCase()} generada correctamente`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : format === "print"
            ? t("common.printError")
            : t("common.genericExportError"),
      );
    } finally {
      setLoadingFormat(null);
    }
  };

  return (
    <div
      className={cn(
        "bg-card border border-border/60 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md",
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border/60 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground leading-none">
              {showExportActions
                ? t("common.export")
                : locale === "en"
                  ? "Payment filters"
                  : "Filtros de pagos"}
            </h3>
            <p className="text-xs text-muted-foreground/80 mt-1">
              {showExportActions
                ? helperText
                : locale === "en"
                  ? "Filters update the earnings report and payment detail."
                  : "Los filtros actualizan el reporte de ganancias y el detalle de pagos."}
            </p>
          </div>
        </div>
        {hasAnyFilter && (
          <div className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 text-[11px] font-semibold text-muted-foreground border border-border/40">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span>{locale === "en" ? "Filters Active" : "Filtros Activos"}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3.5 w-full">
        <ExportFilterControls
          eventId={eventId}
          status={status}
          category={category}
          fromDate={fromDate}
          toDate={toDate}
          eventOptions={eventOptions}
          categoryOptions={categoryOptions}
          statusOptions={statusOptions}
          enableDateRange={enableDateRange}
          locale={locale}
          labels={{
            filterByEvent: t("common.filterByEvent"),
            allEventsOption: t("common.allEventsOption"),
            filterByCategory: t("common.filterByCategory"),
            allCategoriesOption: t("common.allCategoriesOption"),
            filterByStatus: t("common.filterByStatus"),
            allStatesOption: locale === "en" ? "All states" : "Todos los estados",
            fromDate: t("common.fromDate"),
            toDate: t("common.toDate"),
          }}
          onFilterChange={updateFilter}
        />

        {showExportActions && (
          <ExportActionButtons
            loadingFormat={loadingFormat}
            labels={{
              exportExcel: t("common.exportExcel"),
              exportPdf: t("common.exportPdf"),
              print: t("common.print"),
              exporting: t("common.exporting"),
              printing: t("common.printing"),
            }}
            onExport={handleExport}
          />
        )}
      </div>
    </div>
  );
}
