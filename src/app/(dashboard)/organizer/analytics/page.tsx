import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminAnalyticsView } from "@/components/dashboard/admin/AdminAnalyticsView";
import { FunnelAnalyticsCard } from "@/components/dashboard/analytics/FunnelAnalyticsCard";
import {
  getAdminDashboardStats,
  getOrganizerFunnelStats,
  type AdminStatsRange,
} from "@/services/analytics/analytics.service";
import { getI18n } from "@/lib/i18n/server";
import { getRequestSession } from "@/lib/request-context";
import { hasEffectivePermission } from "@/lib/auth/effective-permissions";

const RANGE_OPTIONS: AdminStatsRange[] = ["30d", "90d", "12m", "all"];

function normalizeRange(value?: string): AdminStatsRange {
  if (value && RANGE_OPTIONS.includes(value as AdminStatsRange)) {
    return value as AdminStatsRange;
  }
  return "12m";
}

interface OrganizerAnalyticsPageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function OrganizerAnalyticsPage({
  searchParams,
}: OrganizerAnalyticsPageProps) {
  const session = await getRequestSession();
  if (!session?.user?.id) redirect("/login");

  const role = session.user.role;
  if (role !== "organizer" && role !== "super_admin") {
    redirect(role === "admin" ? "/admin" : "/member");
  }

  if (role !== "super_admin" && !(await hasEffectivePermission(role, "analytics:view:own"))) {
    redirect("/organizer");
  }

  const { t } = await getI18n();
  const { range: rawRange } = await searchParams;
  const selectedRange = normalizeRange(rawRange);

  const [stats, funnel] = await Promise.all([
    getAdminDashboardStats({
      range: selectedRange,
      organizerId: session.user.id,
    }),
    getOrganizerFunnelStats({ organizerId: session.user.id }),
  ]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {t("dashboard.organizer.analyticsTitle")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("dashboard.organizer.analyticsIntro")}</p>
      </div>

      <FunnelAnalyticsCard funnel={funnel} />

      <Suspense fallback={null}>
        <AdminAnalyticsView
          mode="own"
          stats={stats}
          selectedRange={selectedRange}
          rangeBasePath="/organizer/analytics"
          exportTitle={t("dashboard.organizer.analyticsTitle")}
          showExport
        />
      </Suspense>
    </div>
  );
}
