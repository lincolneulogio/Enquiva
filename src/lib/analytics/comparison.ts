import type { AdminStatsRange } from "./admin";

export type StatsComparison = {
  totalUsers: number | null;
  totalEvents: number | null;
  totalRegistrations: number | null;
  totalRevenue: number | null;
  periodLabelKey: string;
};

export function computePercentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return null;
    return 100;
  }
  return Math.round(((current - previous) / previous) * 100);
}

/** Ventana actual y anterior del mismo tamaño para comparar tendencias. */
export function getComparisonWindows(range: AdminStatsRange): {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
  periodLabelKey: string;
} {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  const days =
    range === "30d" ? 30 : range === "90d" ? 90 : range === "12m" ? 365 : 30;

  const currentEnd = new Date(now);
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - days);
  currentStart.setHours(0, 0, 0, 0);

  const previousEnd = new Date(currentStart);
  previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - days);
  previousStart.setHours(0, 0, 0, 0);

  const periodLabelKey =
    range === "30d"
      ? "statsComparePrevious30d"
      : range === "90d"
        ? "statsComparePrevious90d"
        : range === "12m"
          ? "statsComparePrevious12m"
          : "statsComparePrevious30d";

  return { currentStart, currentEnd, previousStart, previousEnd, periodLabelKey };
}
