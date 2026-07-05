import Link from "next/link";
import {
  AdminKpiCard,
  EntityInviteBanner,
} from "@/components/dashboard";
import { AdminStatsSectionHeader } from "@/components/dashboard/admin/AdminStatsSectionHeader";
import { AdminAnalyticsQuickLinks } from "@/components/dashboard/admin/AdminAnalyticsQuickLinks";
import { AdminPendingPaymentsAlert } from "@/components/dashboard/admin/AdminPendingPaymentsAlert";
import { AdminRevenueSplitCards } from "@/components/dashboard/admin/AdminRevenueSplitCards";
import { Users, CalendarDays, BadgeCheck, Ticket } from "lucide-react";
import { getAdminDashboardStats } from "@/lib/analytics/admin";
import { getDashboardRevenueSnapshot } from "@/lib/analytics/platform-revenue";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale } from "@/lib/i18n/core";
import { resolveAdminScope, getOrganizationIdFromScope } from "@/lib/organizations/admin-scope";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function AdminDashboardPage() {
  const { locale, t } = await getI18n();
  const session = await auth.api.getSession({ headers: await headers() });
  const adminScope = await resolveAdminScope();
  const organizationId = getOrganizationIdFromScope(adminScope);
  const isEntityScope = adminScope.mode === "org";
  const isPlatformSuperAdmin =
    adminScope.mode === "platform" && session?.user?.role === "super_admin";

  const stats = await getAdminDashboardStats({ organizationId });
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
      color: "text-primary",
      iconBg: "bg-primary/10",
      Icon: Users,
      href: "/admin/users",
      delta: stats.comparisons.totalUsers,
    },
    {
      label: t("dashboard.admin.totalEvents"),
      value: stats.totalEvents.toLocaleString(intl),
      color: "text-blue-600",
      iconBg: "bg-blue-500/10",
      Icon: CalendarDays,
      href: "/admin/events",
      delta: stats.comparisons.totalEvents,
    },
    {
      label: t("dashboard.admin.publishedEvents"),
      value: stats.publishedEvents.toLocaleString(intl),
      color: "text-green-600",
      iconBg: "bg-green-500/10",
      Icon: BadgeCheck,
      href: "/admin/events?status=published",
    },
    {
      label: t("dashboard.admin.totalRegistrations"),
      value: stats.totalRegistrations.toLocaleString(intl),
      color: "text-accent",
      iconBg: "bg-accent/10",
      Icon: Ticket,
      href: "/admin/registrations",
      delta: stats.comparisons.totalRegistrations,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {isEntityScope
            ? t("dashboard.admin.entityOverview", { name: adminScope.organizationName })
            : t("dashboard.admin.platformOverview")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isEntityScope
            ? t("dashboard.admin.entityMonitorActivity")
            : t("dashboard.admin.monitorActivity")}
        </p>
      </div>

      {isEntityScope ? (
        <EntityInviteBanner
          inviteCode={adminScope.inviteCode}
          entityName={adminScope.organizationName}
        />
      ) : null}

      <AdminPendingPaymentsAlert count={stats.pendingPaymentsCount} />

      {isEntityScope ? (
        <AdminStatsSectionHeader scope="entity" />
      ) : (
        <AdminStatsSectionHeader scope="platform-global" />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <AdminKpiCard key={kpi.label} {...kpi} periodLabel={kpi.delta != null ? periodLabel : undefined} />
        ))}
      </div>

      {revenueSnapshot ? (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {t("dashboard.admin.revenueSplitTitle")}
          </h2>
          <AdminRevenueSplitCards snapshot={revenueSnapshot} />
        </section>
      ) : null}

      {isPlatformSuperAdmin ? (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {t("dashboard.admin.analyticsQuickLinksTitle")}
          </h2>
          <AdminAnalyticsQuickLinks />
        </section>
      ) : isEntityScope ? (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {t("dashboard.admin.analyticsQuickLinksTitle")}
          </h2>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            {t("dashboard.admin.analyticsEntityLink")}
          </Link>
        </section>
      ) : null}
    </div>
  );
}
