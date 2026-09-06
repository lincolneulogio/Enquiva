import { getI18n } from "@/lib/i18n/server";
import { AdminStatsChartsLazy as AdminStatsCharts } from "../AdminStatsChartsLazy";
import { AdminStatsSectionHeader } from "../AdminStatsSectionHeader";
import { AdminOwnEventsEmptyState } from "../AdminOwnEventsEmptyState";
import { AdminAnalyticsExportBar } from "../AdminAnalyticsExportBar";
import { AdminAnalyticsRangeFilter } from "./AdminAnalyticsRangeFilter";
import { AdminAnalyticsSummaryCards } from "./AdminAnalyticsSummaryCards";
import { AdminAnalyticsBreakdowns } from "./AdminAnalyticsBreakdowns";
import type { AdminAnalyticsViewProps } from "./types";

export type { AdminAnalyticsViewProps, AdminAnalyticsMode, AdminAnalyticsStats } from "./types";

export async function AdminAnalyticsView({
  mode,
  stats,
  selectedRange,
  rangeBasePath,
  exportTitle = "",
  showExport = false,
}: AdminAnalyticsViewProps) {
  const { locale, t } = await getI18n();

  if (mode === "own" && stats.totalEvents === 0) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-border/80 bg-card p-2 sm:p-2.5 shadow-2xs">
          <AdminAnalyticsRangeFilter
            selectedRange={selectedRange}
            rangeBasePath={rangeBasePath}
            t={t}
          />
        </div>
        <AdminOwnEventsEmptyState />
      </div>
    );
  }

  const globalScope = mode === "entity" ? "entity" : mode === "own" ? "own-events" : "platform-global";
  const eventsScope = mode === "entity" ? "entity" : mode === "own" ? "own-events" : "platform-events";

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Consolidated Toolbar: Date Range & Export Actions */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-border/80 bg-card p-2 sm:p-2.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <AdminAnalyticsRangeFilter
          selectedRange={selectedRange}
          rangeBasePath={rangeBasePath}
          t={t}
        />

        {showExport && exportTitle ? (
          <div className="flex items-center justify-between border-t border-border/60 pt-2 sm:border-t-0 sm:pt-0 sm:justify-end">
            <AdminAnalyticsExportBar stats={stats} mode={mode} title={exportTitle} />
          </div>
        ) : null}
      </div>

      <AdminStatsSectionHeader scope={globalScope} />

      <AdminAnalyticsSummaryCards
        mode={mode}
        stats={stats}
        locale={locale}
        t={t}
      />

      <AdminAnalyticsBreakdowns
        mode={mode}
        stats={stats}
        t={t}
      />

      {mode !== "own" ? <AdminStatsSectionHeader scope={eventsScope} className="pt-2" /> : null}

      <AdminStatsCharts
        monthlyData={stats.monthlyActivity}
        categoryData={stats.categoryData}
        paymentMethodsStats={stats.paymentMethodsStats}
        totalRevenue={stats.totalRevenue}
        pendingPaymentsCount={stats.pendingPaymentsCount}
        avgPayment={stats.avgPayment}
        totalCapacity={stats.totalCapacity}
        occupiedSeats={stats.occupiedSeats}
        checkedInCount={stats.checkedInCount}
        registeredCount={stats.registeredCount}
        waitlistedCount={stats.waitlistedCount}
        approvedPaymentsCount={stats.approvedPaymentsCount}
        totalEventViews={stats.totalEventViews}
        hideUserSeries={mode === "own"}
        showEventRevenueHint={mode === "global"}
      />
    </div>
  );
}
