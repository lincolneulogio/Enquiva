import { Suspense } from "react";
import { AdminAnalyticsView } from "@/components/dashboard/admin/AdminAnalyticsView";
import { AdminAnalyticsOrgFilter } from "@/components/dashboard/admin/AdminAnalyticsOrgFilter";
import { getAnalyticsOrganizationOptions } from "@/actions/admin/analytics-orgs";
import { getAdminDashboardStats, type AdminStatsRange } from "@/services/analytics/analytics.service";
import { getI18n } from "@/lib/i18n/server";
import { resolveAdminScope, getOrganizationIdFromScope } from "@/lib/organizations/admin-scope";
import { getRequestSession } from "@/lib/request-context";
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
  const session = await getRequestSession();
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
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md border border-sky-200/80 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300">
              {isEntityScope ? "VISTA ENTIDAD" : "ANALÍTICA GLOBAL"}
            </span>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {exportTitle}
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {isEntityScope
              ? t("dashboard.admin.analyticsEntityIntro")
              : t("dashboard.admin.analyticsGlobalIntro")}
          </p>
        </div>
        {isPlatformSuperAdmin && orgOptions.length > 0 ? (
          <div className="shrink-0">
            <Suspense fallback={null}>
              <AdminAnalyticsOrgFilter
                organizations={orgOptions}
                selectedOrgId={organizationId}
              />
            </Suspense>
          </div>
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
