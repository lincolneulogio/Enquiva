"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { printJsPdf } from "@/lib/export/print-pdf";
import type { AdminDashboardStatsResult } from "@/lib/analytics/admin";
import type { AdminAnalyticsMode } from "./AdminAnalyticsView";

type AdminAnalyticsExportBarProps = {
  stats: AdminDashboardStatsResult;
  mode: AdminAnalyticsMode;
  title: string;
};

function statsToRows(stats: AdminDashboardStatsResult) {
  return [
    { metric: "totalUsers", value: stats.totalUsers },
    { metric: "totalEvents", value: stats.totalEvents },
    { metric: "publishedEvents", value: stats.publishedEvents },
    { metric: "totalRegistrations", value: stats.totalRegistrations },
    { metric: "totalRevenue", value: stats.totalRevenue },
    { metric: "pendingPayments", value: stats.pendingPaymentsCount },
    { metric: "approvedPayments", value: stats.approvedPaymentsCount },
    { metric: "checkedIn", value: stats.checkedInCount },
    { metric: "registered", value: stats.registeredCount },
    { metric: "waitlisted", value: stats.waitlistedCount },
    { metric: "transportOccupancy", value: `${stats.occupiedSeats}/${stats.totalCapacity}` },
    { metric: "eventViews", value: stats.totalEventViews },
    ...stats.monthlyActivity.map((row) => ({
      metric: `month_${row.month}`,
      value: `events:${row.events} reg:${row.registrations} users:${row.users}`,
    })),
  ];
}

export function AdminAnalyticsExportBar({ stats, mode, title }: AdminAnalyticsExportBarProps) {
  const t = useTranslations();
  const [loading, setLoading] = useState<"csv" | "pdf" | "print" | null>(null);

  const metricLabel = (key: string) => {
    const map: Record<string, string> = {
      totalUsers: t("dashboard.admin.totalUsers"),
      totalEvents: t("dashboard.admin.totalEvents"),
      publishedEvents: t("dashboard.admin.publishedEvents"),
      totalRegistrations: t("dashboard.admin.totalRegistrations"),
      totalRevenue: t("dashboard.admin.statsTotalRevenue"),
      pendingPayments: t("dashboard.admin.statsPendingPayments"),
      approvedPayments: t("dashboard.admin.statsFunnelStagePayment"),
      checkedIn: t("dashboard.admin.statsAttendanceRate"),
      registered: t("dashboard.admin.statsWaitlistActiveRegistrations"),
      waitlisted: t("dashboard.admin.statsWaitlistActive"),
      transportOccupancy: t("dashboard.admin.statsTransportOccupancy"),
      eventViews: t("dashboard.admin.statsFunnelStageTraffic"),
    };
    if (key.startsWith("month_")) return key.replace("month_", "");
    return map[key] ?? key;
  };

  const exportCsv = () => {
    setLoading("csv");
    try {
      const rows = statsToRows(stats);
      const header = `${t("dashboard.admin.exportMetric")},${t("dashboard.admin.exportValue")}`;
      const body = rows
        .map((row) => `"${metricLabel(row.metric)}","${String(row.value).replace(/"/g, '""')}"`)
        .join("\n");
      const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics-${mode}-${stats.range}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t("dashboard.admin.exportCsvSuccess"));
    } catch {
      toast.error(t("dashboard.admin.exportError"));
    } finally {
      setLoading(null);
    }
  };

  const buildAnalyticsPdf = async () => {
    const [{ jsPDF }, autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`${t("dashboard.admin.exportGenerated")}: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`${t("dashboard.admin.exportRange")}: ${stats.range}`, 14, 36);

    autoTableModule.default(doc, {
      startY: 44,
      head: [[t("dashboard.admin.exportMetric"), t("dashboard.admin.exportValue")]],
      body: statsToRows(stats).map((row) => [metricLabel(row.metric), String(row.value)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [109, 76, 217] },
    });

    return doc;
  };

  const exportPdf = async () => {
    setLoading("pdf");
    try {
      const doc = await buildAnalyticsPdf();
      doc.save(`analytics-${mode}-${stats.range}.pdf`);
      toast.success(t("dashboard.admin.exportPdfSuccess"));
    } catch {
      toast.error(t("dashboard.admin.exportError"));
    } finally {
      setLoading(null);
    }
  };

  const printPdf = async () => {
    setLoading("print");
    try {
      const doc = await buildAnalyticsPdf();
      await printJsPdf(doc);
      toast.success(t("dashboard.admin.exportPrintSuccess"));
    } catch {
      toast.error(t("common.printError"));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={exportCsv}
        disabled={loading !== null}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50 disabled:opacity-50"
      >
        <FileSpreadsheet className="h-4 w-4" />
        {loading === "csv" ? t("common.loading") : "CSV"}
      </button>
      <button
        type="button"
        onClick={exportPdf}
        disabled={loading !== null}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50 disabled:opacity-50"
      >
        <FileText className="h-4 w-4" />
        {loading === "pdf" ? t("common.loading") : "PDF"}
      </button>
      <button
        type="button"
        onClick={printPdf}
        disabled={loading !== null}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50 disabled:opacity-50"
      >
        <Printer className="h-4 w-4" />
        {loading === "print" ? t("common.printing") : t("common.print")}
      </button>
      <span className="text-xs text-muted-foreground">
        <Download className="mr-1 inline h-3.5 w-3.5" />
        {t("dashboard.admin.exportHint")}
      </span>
    </div>
  );
}
