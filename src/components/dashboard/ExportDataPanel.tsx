"use client";

import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText, Filter } from "lucide-react";
import { toast } from "sonner";
import { getExportData, type ExportCategoryOption, type ExportEventOption, type ExportPayload, type ExportResource, type ExportScope } from "@/actions/exports";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
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

async function downloadPdf(payload: ExportPayload) {
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

    doc.save(`${payload.suggestedFileName}.pdf`);
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
    className,
}: ExportDataPanelProps) {
    const t = useTranslations();
    const { locale } = useLocale();
    const [eventId, setEventId] = useState("");
    const [status, setStatus] = useState(initialStatus);
    const [category, setCategory] = useState(initialCategory);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [loadingFormat, setLoadingFormat] = useState<"pdf" | "excel" | null>(null);

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

    const handleExport = async (format: "pdf" | "excel") => {
        try {
            setLoadingFormat(format);
            const payload = await getExportData({
                resource,
                scope,
                eventId: eventId || null,
                status: hasStatusFilter ? status : null,
                category: hasCategoryFilter ? category || null : null,
                fromDate: enableDateRange && fromDate ? fromDate : null,
                toDate: enableDateRange && toDate ? toDate : null,
            });

            if (format === "excel") {
                await downloadExcel(payload);
            } else {
                await downloadPdf(payload);
            }

            toast.success(
                locale === "en"
                    ? `${format.toUpperCase()} export generated successfully`
                    : `Exportación ${format.toUpperCase()} generada correctamente`
            );
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t("common.genericExportError"));
        } finally {
            setLoadingFormat(null);
        }
    };

    return (
        <div className={cn("rounded-2xl border border-border bg-card p-4 shadow-sm", className)}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Download className="h-4 w-4 text-primary" />
                        {t("common.export")}
                    </div>
                    <p className="text-xs text-muted-foreground">{helperText}</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end lg:justify-end">
                    {hasEventFilter ? (
                        <label className="flex min-w-[220px] flex-col gap-1 text-xs text-muted-foreground">
                            {t("common.filterByEvent")}
                            <select
                                value={eventId}
                                onChange={(event) => setEventId(event.target.value)}
                                className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                            >
                                <option value="">{t("common.allEventsOption")}</option>
                                {eventOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.title}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ) : null}

                    {hasCategoryFilter ? (
                        <label className="flex min-w-[180px] flex-col gap-1 text-xs text-muted-foreground">
                            {t("common.filterByCategory")}
                            <select
                                value={category}
                                onChange={(event) => setCategory(event.target.value)}
                                className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                            >
                                <option value="">{t("common.allCategoriesOption")}</option>
                                {categoryOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ) : null}

                    {hasStatusFilter ? (
                        <label className="flex min-w-[180px] flex-col gap-1 text-xs text-muted-foreground">
                            {t("common.filterByStatus")}
                            <select
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                                className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                            >
                                {statusOptions?.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ) : null}

                    {enableDateRange ? (
                        <>
                            <label className="flex min-w-[170px] flex-col gap-1 text-xs text-muted-foreground">
                                {t("common.fromDate")}
                                <input
                                    type="date"
                                    value={fromDate}
                                    max={toDate || undefined}
                                    onChange={(event) => setFromDate(event.target.value)}
                                    className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                                />
                            </label>

                            <label className="flex min-w-[170px] flex-col gap-1 text-xs text-muted-foreground">
                                {t("common.toDate")}
                                <input
                                    type="date"
                                    value={toDate}
                                    min={fromDate || undefined}
                                    onChange={(event) => setToDate(event.target.value)}
                                    className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                                />
                            </label>
                        </>
                    ) : null}

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleExport("excel")}
                            disabled={loadingFormat !== null}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-500/15 disabled:opacity-60 dark:text-emerald-300"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            {loadingFormat === "excel" ? t("common.exporting") : t("common.exportExcel")}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleExport("pdf")}
                            disabled={loadingFormat !== null}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/15 disabled:opacity-60"
                        >
                            <FileText className="h-4 w-4" />
                            {loadingFormat === "pdf" ? t("common.exporting") : t("common.exportPdf")}
                        </button>
                    </div>
                </div>
            </div>

            {hasAnyFilter && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] text-muted-foreground">
                    <Filter className="h-3.5 w-3.5" />
                    {locale === "en"
                        ? "Exports respect the selected filters"
                        : "La exportación respeta los filtros seleccionados"}
                </div>
            )}
        </div>
    );
}
