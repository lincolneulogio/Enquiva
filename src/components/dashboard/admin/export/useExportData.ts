"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
import { downloadExcel, buildExportPdf } from "./export-generators";
import type { StatusOption } from "./ExportFilterControls";

export interface UseExportDataOptions {
  resource: ExportResource;
  scope: ExportScope;
  eventOptions?: ExportEventOption[];
  categoryOptions?: ExportCategoryOption[];
  statusOptions?: StatusOption[];
  initialStatus?: string;
  initialCategory?: string;
  enableDateRange?: boolean;
}

export function useExportData({
  resource,
  scope,
  eventOptions = [],
  categoryOptions = [],
  statusOptions,
  initialStatus = "all",
  initialCategory = "",
  enableDateRange = true,
}: UseExportDataOptions) {
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

  return {
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
  };
}
