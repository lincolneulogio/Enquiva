"use client";

import { Download, Filter } from "lucide-react";
import {
  type ExportCategoryOption,
  type ExportEventOption,
  type ExportResource,
  type ExportScope,
} from "@/actions/exports";
import { cn } from "@/lib/utils";
import {
  ExportFilterControls,
  ExportActionButtons,
  type StatusOption,
} from "./index";
import { useExportData } from "./useExportData";

export interface ExportDataPanelProps {
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
  const {
    t,
    locale,
    eventId,
    status,
    category,
    fromDate,
    toDate,
    loadingFormat,
    updateFilter,
    hasAnyFilter,
    helperText,
    handleExport,
  } = useExportData({
    resource,
    scope,
    eventOptions,
    categoryOptions,
    statusOptions,
    initialStatus,
    initialCategory,
    enableDateRange,
  });

  const filterLabels = {
    filterByEvent: t("common.filterByEvent"),
    allEventsOption: t("common.allEventsOption"),
    filterByCategory: t("common.filterByCategory"),
    allCategoriesOption: t("common.allCategoriesOption"),
    filterByStatus: t("common.filterByStatus"),
    allStatesOption: locale === "en" ? "All states" : "Todos los estados",
    fromDate: t("common.fromDate"),
    toDate: t("common.toDate"),
  };

  const actionLabels = {
    exportExcel: t("common.exportExcel"),
    exportPdf: t("common.exportPdf"),
    print: t("common.print"),
    exporting: t("common.exporting"),
    printing: t("common.printing"),
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
          labels={filterLabels}
          onFilterChange={updateFilter}
        />

        {showExportActions && (
          <ExportActionButtons
            loadingFormat={loadingFormat}
            labels={actionLabels}
            onExport={handleExport}
          />
        )}
      </div>
    </div>
  );
}
