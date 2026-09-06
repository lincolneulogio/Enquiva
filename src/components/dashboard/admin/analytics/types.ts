import type { AdminStatsRange } from "@/lib/analytics/admin";

export type AdminAnalyticsMode = "global" | "entity" | "own";

export type AdminAnalyticsStats = Awaited<
  ReturnType<typeof import("@/lib/analytics/admin").getAdminDashboardStats>
>;

export interface AdminAnalyticsViewProps {
  mode: AdminAnalyticsMode;
  stats: AdminAnalyticsStats;
  selectedRange: AdminStatsRange;
  rangeBasePath: string;
  exportTitle?: string;
  showExport?: boolean;
}
