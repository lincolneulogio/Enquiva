"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Download, FileSpreadsheet, FileText, Filter, Printer } from "lucide-react";
import { toast } from "sonner";
import { getExportData, type ExportCategoryOption, type ExportEventOption, type ExportPayload, type ExportResource, type ExportScope } from "@/actions/exports";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { printJsPdf } from "@/lib/export/print-pdf";
import { cn } from "@/lib/utils";

type StatusOption = {
    value: string;
    label: string;
};

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

function downloadExcel(payload: ExportPayload) {
    return import("xlsx").then((XLSX) => {
        const records = payload.rows.map((row) =>
            Object.fromEntries(payload.columns.map((column) => [column.label, row[column.key] ?? ""]))
        );

        const worksheet = XLSX.utils.json_to_sheet(records);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Export");
        XLSX.writeFile(workbook, `${payload.suggestedFileName}.xlsx`);
    });
}

async function buildExportPdf(payload: ExportPayload) {
    const [{ jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
    ]);

    const autoTable = autoTableModule.default;
    const orientation = payload.columns.length > 7 ? "landscape" : "portrait";
    const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });

    doc.setFontSize(16);
    doc.text(payload.title, 40, 44);

    doc.setFontSize(10);
    if (payload.subtitle) {
        doc.text(payload.subtitle, 40, 62);
    }

    let summaryY = payload.subtitle ? 80 : 62;
    for (const item of payload.summary) {
        doc.text(`${item.label}: ${item.value}`, 40, summaryY);
        summaryY += 14;
    }

    doc.setFontSize(9);
    doc.text(`Generado: ${new Date(payload.generatedAt).toLocaleString()}`, 40, summaryY + 4);

    autoTable(doc, {
        startY: summaryY + 18,
        head: [payload.columns.map((column) => column.label)],
        body: payload.rows.map((row) => payload.columns.map((column) => String(row[column.key] ?? ""))),
        styles: {
            fontSize: 8,
            cellPadding: 6,
            overflow: "linebreak",
        },
        headStyles: {
            fillColor: [109, 76, 217],
        },
        alternateRowStyles: {
            fillColor: [246, 244, 255],
        },
        margin: { top: 36, right: 24, bottom: 28, left: 24 },
    });

    return doc;
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

    // Sync state directly from URL query parameters (single source of truth)
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
        params.delete("page"); // Reset page number on filter changes
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const hasEventFilter = eventOptions.length > 0;
    const hasStatusFilter = Boolean(statusOptions?.length);
    const hasCategoryFilter = categoryOptions.length > 0;
    const hasAnyFilter = hasEventFilter || hasStatusFilter || hasCategoryFilter || enableDateRange;

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
        const exportFormat = format;
        try {
            setLoadingFormat(exportFormat);
            const payload = await getExportData({
                resource,
                scope,
                eventId: eventId || null,
                status: hasStatusFilter ? status : null,
                category: hasCategoryFilter ? category || null : null,
                fromDate: enableDateRange && fromDate ? fromDate : null,
                toDate: enableDateRange && toDate ? toDate : null,
            });

            if (exportFormat === "excel") {
                await downloadExcel(payload);
            } else {
                const doc = await buildExportPdf(payload);
                if (exportFormat === "print") {
                    await printJsPdf(doc);
                } else {
                    doc.save(`${payload.suggestedFileName}.pdf`);
                }
            }

            toast.success(
                exportFormat === "print"
                    ? t("common.printOpened")
                    : locale === "en"
                      ? `${exportFormat.toUpperCase()} export generated successfully`
                      : `Exportación ${exportFormat.toUpperCase()} generada correctamente`
            );
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : exportFormat === "print"
                      ? t("common.printError")
                      : t("common.genericExportError")
            );
        } finally {
            setLoadingFormat(null);
        }
    };

    return (
        <div className={cn("bg-card border border-border/60 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md", className)}>
            {/* Header: Title and Description */}
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

            {/* Content: Single Row Responsive Filters and Actions */}
            <div className="flex flex-wrap items-end gap-3.5 w-full">
                {/* Event dropdown */}
                {hasEventFilter && (
                    <div className="flex-1 min-w-[200px] max-w-xs space-y-1.5">
                        <label htmlFor="export-event-select" className="text-xs font-semibold text-muted-foreground tracking-wide block">
                            {t("common.filterByEvent")}
                        </label>
                        <select
                            id="export-event-select"
                            value={eventId}
                            onChange={(e) => {
                                updateFilter("eventId", e.target.value);
                            }}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-10 transition-all hover:bg-background/80"
                        >
                            <option value="">{t("common.allEventsOption")}</option>
                            {eventOptions.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.title}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Category dropdown */}
                {hasCategoryFilter && (
                    <div className="flex-1 min-w-[160px] max-w-[200px] space-y-1.5">
                        <label htmlFor="export-category-select" className="text-xs font-semibold text-muted-foreground tracking-wide block">
                            {t("common.filterByCategory")}
                        </label>
                        <select
                            id="export-category-select"
                            value={category}
                            onChange={(e) => {
                                updateFilter("category", e.target.value);
                            }}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-10 transition-all hover:bg-background/80"
                        >
                            <option value="">{t("common.allCategoriesOption")}</option>
                            {categoryOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Status dropdown */}
                {hasStatusFilter && statusOptions && (
                    <div className="flex-1 min-w-[140px] max-w-[180px] space-y-1.5">
                        <label htmlFor="export-status-select" className="text-xs font-semibold text-muted-foreground tracking-wide block">
                            {t("common.filterByStatus")}
                        </label>
                        <select
                            id="export-status-select"
                            value={status}
                            onChange={(e) => {
                                updateFilter("status", e.target.value);
                            }}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-10 transition-all hover:bg-background/80"
                        >
                            <option value="all">
                                {locale === "en" ? "All states" : "Todos los estados"}
                            </option>
                            {statusOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Date range inputs */}
                {enableDateRange && (
                    <>
                        <div className="flex-1 min-w-[130px] max-w-[160px] space-y-1.5">
                            <label htmlFor="export-from-date" className="text-xs font-semibold text-muted-foreground tracking-wide block">
                                {t("common.fromDate")}
                            </label>
                            <input
                                id="export-from-date"
                                type="date"
                                value={fromDate}
                                onChange={(e) => {
                                    updateFilter("fromDate", e.target.value);
                                }}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-10 transition-all hover:bg-background/80 block"
                            />
                        </div>
                        <div className="flex-1 min-w-[130px] max-w-[160px] space-y-1.5">
                            <label htmlFor="export-to-date" className="text-xs font-semibold text-muted-foreground tracking-wide block">
                                {t("common.toDate")}
                            </label>
                            <input
                                id="export-to-date"
                                type="date"
                                value={toDate}
                                onChange={(e) => {
                                    updateFilter("toDate", e.target.value);
                                }}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-10 transition-all hover:bg-background/80 block"
                            />
                        </div>
                    </>
                )}

                {/* Buttons block */}
                {showExportActions && (
                <div className="flex items-center gap-2 mt-auto sm:ml-auto w-full sm:w-auto h-10 pt-2 sm:pt-0">
                    <button
                        onClick={() => handleExport("excel")}
                        disabled={loadingFormat !== null}
                        className={cn(
                            "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50",
                            "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 dark:hover:bg-emerald-950/40"
                        )}
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>{loadingFormat === "excel" ? t("common.exporting") : t("common.exportExcel")}</span>
                    </button>
                    <button
                        onClick={() => handleExport("pdf")}
                        disabled={loadingFormat !== null}
                        className={cn(
                            "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50",
                            "bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/30 dark:hover:bg-violet-950/40"
                        )}
                    >
                        <FileText className="h-4 w-4" />
                        <span>{loadingFormat === "pdf" ? t("common.exporting") : t("common.exportPdf")}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleExport("print")}
                        disabled={loadingFormat !== null}
                        className={cn(
                            "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50",
                            "bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30 dark:hover:bg-sky-950/40"
                        )}
                    >
                        <Printer className="h-4 w-4" />
                        <span>{loadingFormat === "print" ? t("common.printing") : t("common.print")}</span>
                    </button>
                </div>
                )}
            </div>
        </div>
    );
}
