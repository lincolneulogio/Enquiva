import { Suspense } from "react";
import { AdminAnalyticsView } from "@/components/dashboard/admin/AdminAnalyticsView";
import { AdminAnalyticsScopeNav } from "@/components/dashboard/admin/AdminAnalyticsScopeNav";
import { AdminAnalyticsOrgFilter } from "@/components/dashboard/admin/AdminAnalyticsOrgFilter";
import { getAnalyticsOrganizationOptions } from "@/actions/admin/analytics-orgs";
import { getAdminDashboardStats, type AdminStatsRange } from "@/lib/analytics/admin";
import { getI18n } from "@/lib/i18n/server";
import { resolveAdminScope, getOrganizationIdFromScope } from "@/lib/organizations/admin-scope";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasEffectivePermission } from "@/lib/auth/effective-permissions";
import { staffDashboardPath } from "@/lib/navigation/dashboard-paths";
import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";

const RANGE_OPTIONS: AdminStatsRange[] = ["30d", "90d", "12m", "all"];

function normalizeRange(value?: string): AdminStatsRange {
  if (value && RANGE_OPTIONS.includes(value as AdminStatsRange)) {
    return value as AdminStatsRange;
  }
  return "12m";
}

export type AnalyticsPageSearchParams = {
  range?: string;
  org?: string;
};

export function resolveAnalyticsOrganizationId(
  adminScope: Awaited<ReturnType<typeof resolveAdminScope>>,
  isPlatformSuperAdmin: boolean,
  orgParam?: string,
) {
  if (adminScope.mode === "org") {
    return getOrganizationIdFromScope(adminScope);
  }
  if (isPlatformSuperAdmin && orgParam) {
    return orgParam;
  }
  return null;
}

interface AdminAnalyticsPageProps {
  searchParams: Promise<AnalyticsPageSearchParams>;
}

export default async function AdminAnalyticsPage({ searchParams }: AdminAnalyticsPageProps) {
  const { t } = await getI18n();
  const staffBase = await getStaffBaseFromRequest();
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role;

  if (role !== "super_admin" && !(await hasEffectivePermission(role, "analytics:view:org"))) {
    redirect("/admin");
  }

  const params = await searchParams;
  const selectedRange = normalizeRange(params.range);
  const adminScope = await resolveAdminScope();
  const isEntityScope = adminScope.mode === "org";
  const isPlatformSuperAdmin =
    adminScope.mode === "platform" && session?.user?.role === "super_admin";

  const organizationId = resolveAnalyticsOrganizationId(
    adminScope,
    isPlatformSuperAdmin,
    params.org,
  );

  const [stats, orgOptions] = await Promise.all([
    getAdminDashboardStats({ range: selectedRange, organizationId }),
    isPlatformSuperAdmin ? getAnalyticsOrganizationOptions() : Promise.resolve([]),
  ]);

  const exportTitle = isEntityScope
    ? t("dashboard.admin.analyticsEntityTitle")
    : t("dashboard.admin.analyticsGlobalTitle");

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
            {exportTitle}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isEntityScope
              ? t("dashboard.admin.analyticsEntityIntro")
              : t("dashboard.admin.analyticsGlobalIntro")}
          </p>
        </div>
        {isPlatformSuperAdmin ? (
          <Suspense fallback={null}>
            <AdminAnalyticsScopeNav />
          </Suspense>
        ) : null}
        {isPlatformSuperAdmin && orgOptions.length > 0 ? (
          <Suspense fallback={null}>
            <AdminAnalyticsOrgFilter
              organizations={orgOptions}
              selectedOrgId={organizationId}
            />
          </Suspense>
        ) : null}
      </div>

      <AdminAnalyticsView
        mode={isEntityScope ? "entity" : "global"}
        stats={stats}
        selectedRange={selectedRange}
        rangeBasePath={staffDashboardPath(staffBase, "/analytics")}
        exportTitle={exportTitle}
        showExport
      />
    </div>
  );
}
