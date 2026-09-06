import Link from "next/link";
import { AdminKpiCard } from "@/components/dashboard/admin/AdminKpiCard";
import { EntityInviteBanner } from "@/components/dashboard/admin/EntityInviteBanner";
import { AdminStatsSectionHeader } from "@/components/dashboard/admin/AdminStatsSectionHeader";
import { AdminAnalyticsQuickLinks } from "@/components/dashboard/admin/AdminAnalyticsQuickLinks";
import { AdminPendingPaymentsAlert } from "@/components/dashboard/admin/AdminPendingPaymentsAlert";
import { AdminRevenueSplitCards } from "@/components/dashboard/admin/AdminRevenueSplitCards";
import { AdminDateRangeDropdown, type AdminStatsRange } from "@/components/dashboard/admin/AdminDateRangeDropdown";
import {
  Users,
  CalendarDays,
  BadgeCheck,
  Ticket,
  TrendingUp,
  Coins,
  Download,
} from "lucide-react";
import { getAdminDashboardStats } from "@/services/analytics/analytics.service";
import { getDashboardRevenueSnapshot } from "@/lib/analytics/platform-revenue";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale } from "@/lib/i18n/core";
import { staffDashboardPath } from "@/lib/navigation/dashboard-paths";
import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";
import { resolveAdminScope, getOrganizationIdFromScope } from "@/lib/organizations/admin-scope";
import { getRequestSession } from "@/lib/request-context";

const RANGE_OPTIONS: AdminStatsRange[] = ["30d", "90d", "12m", "all"];

function normalizeRange(value?: string): AdminStatsRange {
  if (value && RANGE_OPTIONS.includes(value as AdminStatsRange)) {
    return value as AdminStatsRange;
  }
  return "30d";
}

export type AdminDashboardPageSearchParams = {
  range?: string;
};

interface AdminDashboardPageProps {
  searchParams?: Promise<AdminDashboardPageSearchParams>;
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps = {}) {
  const { locale, t } = await getI18n();
  const session = await getRequestSession();
  const staffBase = await getStaffBaseFromRequest();
  const adminScope = await resolveAdminScope();
  const organizationId = getOrganizationIdFromScope(adminScope);
  const isEntityScope = adminScope.mode === "org";
  const isPlatformSuperAdmin =
    adminScope.mode === "platform" && session?.user?.role === "super_admin";

  const params = searchParams ? await searchParams : {};
  const selectedRange = normalizeRange(params.range);

  const stats = await getAdminDashboardStats({ organizationId, range: selectedRange });
  const revenueSnapshot =
    isPlatformSuperAdmin && !isEntityScope
      ? await getDashboardRevenueSnapshot(stats.totalRevenue)
      : null;

  const intl = getIntlLocale(locale);
  const periodLabel = t(`dashboard.admin.${stats.comparisons.periodLabelKey}`);

  const kpis = [
    {
      label: t("dashboard.admin.totalUsers"),
      value: stats.totalUsers.toLocaleString(intl),
      color: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50",
      Icon: Users,
      href: staffDashboardPath(staffBase, "users"),
      subtext: t("dashboard.admin.statsRegisteredUnit"),
      sparklineColor: "blue" as const,
      footerLeft: (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {t("dashboard.admin.statsActiveInSystem")}
        </span>
      ),
      footerRight: (
        <span className="inline-flex items-center rounded-md border border-sky-200/80 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300">
          {t("dashboard.admin.stats100Active")}
        </span>
      ),
    },
    {
      label: t("dashboard.admin.totalEvents"),
      value: stats.totalEvents.toLocaleString(intl),
      color: "text-sky-600 dark:text-sky-400",
      iconBg: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50",
      Icon: CalendarDays,
      href: staffDashboardPath(staffBase, "events"),
      subtext:
        stats.totalEvents === 1
          ? t("dashboard.admin.statsCreatedUnit")
          : t("dashboard.admin.statsCreatedUnitPlural"),
      sparklineColor: "sky" as const,
      footerLeft: (
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="h-3.5 w-3.5" />
          +100%
        </span>
      ),
      footerRight: <span className="text-[11px] text-muted-foreground">{periodLabel}</span>,
    },
    {
      label: t("dashboard.admin.publishedEvents"),
      value: stats.publishedEvents.toLocaleString(intl),
      color: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50",
      Icon: BadgeCheck,
      href: `${staffDashboardPath(staffBase, "events")}?status=published`,
      statusBadge: {
        text: t("dashboard.admin.statsOnline100"),
        variant: "emerald" as const,
      },
      sparklineColor: "emerald" as const,
      footerLeft: (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {t("dashboard.admin.statsAvailableStatus")}
        </span>
      ),
      footerRight: (
        <span className="text-[11px] text-muted-foreground">
          {t("dashboard.admin.statsForRegistration")}
        </span>
      ),
    },
    {
      label: t("dashboard.admin.totalRegistrations"),
      value: stats.totalRegistrations.toLocaleString(intl),
      color: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50",
      Icon: Ticket,
      href: staffDashboardPath(staffBase, "registrations"),
      subtext:
        stats.totalRegistrations === 1
          ? t("dashboard.admin.statsAttendeeUnit")
          : t("dashboard.admin.statsAttendeeUnitPlural"),
      sparklineColor: "purple" as const,
      footerLeft: (
        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="h-3.5 w-3.5" />
          +100%
        </span>
      ),
      footerRight: <span className="text-[11px] text-muted-foreground">{periodLabel}</span>,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Header Row with Date Range and Scope Pill */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {isEntityScope
              ? t("dashboard.admin.entityOverview", { name: adminScope.organizationName })
              : t("dashboard.admin.platformOverview")}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {isEntityScope
              ? t("dashboard.admin.entityMonitorActivity")
              : t("dashboard.admin.monitorActivity")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <AdminDateRangeDropdown selectedRange={selectedRange} />

          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/80 bg-sky-50 px-2.5 py-1 text-[11px] font-bold tracking-wider text-sky-700 uppercase shadow-2xs dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            {isEntityScope
              ? t("dashboard.admin.statsScopeBadgeEntity")
              : t("dashboard.admin.statsGlobalViewPill")}
          </span>
        </div>
      </div>

      {isEntityScope ? (
        <EntityInviteBanner
          inviteCode={adminScope.inviteCode}
          entityName={adminScope.organizationName}
        />
      ) : null}

      <AdminPendingPaymentsAlert count={stats.pendingPaymentsCount} staffBase={staffBase} />

      {/* Global Status Banner */}
      {isEntityScope ? (
        <AdminStatsSectionHeader scope="entity" />
      ) : (
        <AdminStatsSectionHeader scope="platform-global" />
      )}

      {/* 4 Modern Stat Cards with Sparklines */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <AdminKpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Revenue Split: Events vs Platform SaaS */}
      {revenueSnapshot ? (
        <section className="space-y-3.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
                {t("dashboard.admin.revenueSplitTitle")}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t("dashboard.admin.statsActiveFlow")}
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground shadow-2xs">
              <Coins className="h-3.5 w-3.5 text-amber-500" />
              <span>{t("dashboard.admin.statsCurrencyPen")}</span>
            </div>
          </div>
          <AdminRevenueSplitCards snapshot={revenueSnapshot} staffBase={staffBase} />
        </section>
      ) : null}

      {/* Detailed Analytics Quick Links */}
      {isPlatformSuperAdmin ? (
        <section className="space-y-3.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
                  {t("dashboard.admin.statsDetailedAnalytics")}
                </h2>
                <span className="inline-flex items-center rounded-full border border-sky-200/80 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-300">
                  {t("dashboard.admin.statsActiveModulesCount", { count: 2 })}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                {t("dashboard.admin.statsDetailedAnalyticsSubtitle")}
              </p>
            </div>

            <Link
              href={`${staffDashboardPath(staffBase, "analytics")}?export=1`}
              className="inline-flex items-center gap-1.5 self-start rounded-xl border border-border/80 bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted/40 sm:self-center"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{t("dashboard.admin.statsExportReports")}</span>
            </Link>
          </div>

          <AdminAnalyticsQuickLinks staffBase={staffBase} />
        </section>
      ) : isEntityScope ? (
        <section className="space-y-3.5">
          <div>
            <h2 className="font-display text-base font-bold text-foreground sm:text-lg">
              {t("dashboard.admin.statsDetailedAnalytics")}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              {t("dashboard.admin.statsDetailedAnalyticsSubtitle")}
            </p>
          </div>

          <Link
            href={staffDashboardPath(staffBase, "analytics")}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            {t("dashboard.admin.analyticsEntityLink")}
          </Link>
        </section>
      ) : null}
    </div>
  );
}

