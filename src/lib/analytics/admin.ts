/**
 * Admin Analytics Service & Types
 * Re-exports from modular sub-modules in @/lib/analytics/admin/
 */
export {
  type AdminStatsRange,
  type MonthlyActivityPoint,
  type CategoryPoint,
  type AdminDashboardStatsOptions,
  RANGE_TO_DAYS,
  formatCategoryLabel,
  buildLastMonthsKeys,
  getRangeStartDate,
  getMonthsForRange,
  buildStatsCacheKey,
} from "./admin/types";

export {
  invalidateAdminDashboardStatsCache,
  getAdminDashboardStats,
  computeAdminDashboardStats,
  type AdminDashboardStatsResult,
} from "./admin/service";
