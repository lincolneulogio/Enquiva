/**
 * Capa de aplicación para analytics de dashboard.
 * Las queries viven en `lib/analytics/*`; este service es el entrypoint estable
 * para páginas y actions (evita acoplar UI a detalles de cache/SQL).
 */
export {
  getAdminDashboardStats,
  invalidateAdminDashboardStatsCache,
  type AdminStatsRange,
  type AdminDashboardStatsResult,
  type MonthlyActivityPoint,
  type CategoryPoint,
} from "@/lib/analytics/admin";

export { getOrganizerFunnelStats } from "@/lib/analytics/funnel";

export { getDashboardRevenueSnapshot } from "@/lib/analytics/platform-revenue";
