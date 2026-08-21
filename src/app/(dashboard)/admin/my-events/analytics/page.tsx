import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminAnalyticsView } from "@/components/dashboard/admin/AdminAnalyticsView";
import { AdminAnalyticsScopeNav } from "@/components/dashboard/admin/AdminAnalyticsScopeNav";
import { getAdminDashboardStats, type AdminStatsRange } from "@/services/analytics/analytics.service";
import { getI18n } from "@/lib/i18n/server";
import { getRequestSession } from "@/lib/request-context";
import { getStaffDashboardHome, staffDashboardPath } from "@/lib/navigation/dashboard-paths";
import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";
import { resolveAdminScope } from "@/lib/organizations/admin-scope";

const RANGE_OPTIONS: AdminStatsRange[] = ["30d", "90d", "12m", "all"];

function normalizeRange(value?: string): AdminStatsRange {
  if (value && RANGE_OPTIONS.includes(value as AdminStatsRange)) {
    return value as AdminStatsRange;
  }
  return "12m";
}

interface AdminMyEventsAnalyticsPageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function AdminMyEventsAnalyticsPage({
  searchParams,
}: AdminMyEventsAnalyticsPageProps) {
  const session = await getRequestSession();
  const adminScope = await resolveAdminScope();
  const staffBase = await getStaffBaseFromRequest();

  if (
    adminScope.mode !== "platform" ||
    session?.user?.role !== "super_admin" ||
    !session.user.id
  ) {
    redirect(staffDashboardPath(staffBase, "analytics"));
  }

  const { t } = await getI18n();
  const { range: rawRange } = await searchParams;
  const selectedRange = normalizeRange(rawRange);

  const stats = await getAdminDashboardStats({
    range: selectedRange,
    organizerId: session.user.id,
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
            {t("dashboard.admin.analyticsOwnTitle")}
          </h1>
          <p className="mt-1 text-muted-foreground">{t("dashboard.admin.analyticsOwnIntro")}</p>
        </div>
        <Suspense fallback={null}>
          <AdminAnalyticsScopeNav />
        </Suspense>
      </div>

      <AdminAnalyticsView
        mode="own"
        stats={stats}
        selectedRange={selectedRange}
        rangeBasePath={staffDashboardPath(staffBase, "/my-events/analytics")}
        exportTitle={t("dashboard.admin.analyticsOwnTitle")}
        showExport
      />
    </div>
  );
}
