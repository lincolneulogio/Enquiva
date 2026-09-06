"use client";

import { SecondaryMetricsCards } from "../charts/SecondaryMetricsCards";
import { ActivityAndPaymentsCharts } from "../charts/ActivityAndPaymentsCharts";
import { CategoriesAndWaitlistCharts } from "../charts/CategoriesAndWaitlistCharts";
import { ConversionFunnelSection } from "../charts/ConversionFunnelSection";
import type { AdminStatsChartsProps } from "../charts/types";

export type { MonthlyDataPoint, CategoryDataPoint, AdminStatsChartsProps } from "../charts/types";

export function AdminStatsCharts({
  monthlyData,
  categoryData,
  paymentMethodsStats,
  totalRevenue,
  pendingPaymentsCount,
  avgPayment,
  totalCapacity,
  occupiedSeats,
  checkedInCount,
  registeredCount,
  waitlistedCount,
  approvedPaymentsCount = 0,
  totalEventViews = 0,
  hideUserSeries = false,
  showEventRevenueHint = false,
}: AdminStatsChartsProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <SecondaryMetricsCards
        totalRevenue={totalRevenue}
        avgPayment={avgPayment}
        pendingPaymentsCount={pendingPaymentsCount}
        checkedInCount={checkedInCount}
        registeredCount={registeredCount}
        totalCapacity={totalCapacity}
        occupiedSeats={occupiedSeats}
        showEventRevenueHint={showEventRevenueHint}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityAndPaymentsCharts
          monthlyData={monthlyData}
          paymentMethodsStats={paymentMethodsStats}
          hideUserSeries={hideUserSeries}
        />

        <CategoriesAndWaitlistCharts
          categoryData={categoryData}
          waitlistedCount={waitlistedCount}
          registeredCount={registeredCount}
        />
      </div>

      <ConversionFunnelSection
        totalEventViews={totalEventViews}
        registeredCount={registeredCount}
        waitlistedCount={waitlistedCount}
        approvedPaymentsCount={approvedPaymentsCount}
        checkedInCount={checkedInCount}
      />
    </div>
  );
}
