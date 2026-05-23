import { AdminStatsCharts } from "@/components/dashboard";
import { Users, CalendarDays, BadgeCheck, Ticket } from "lucide-react";
import { getAdminDashboardStats } from "@/lib/analytics/admin";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale } from "@/lib/i18n/core";

export default async function AdminDashboardPage() {
  const { locale, t } = await getI18n();
  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {t("dashboard.admin.platformOverview")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("dashboard.admin.monitorActivity")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: t("dashboard.admin.totalUsers"),
            value: stats.totalUsers,
            color: "text-primary",
            iconBg: "bg-primary/10",
            Icon: Users,
          },
          {
            label: t("dashboard.admin.totalEvents"),
            value: stats.totalEvents,
            color: "text-blue-600",
            iconBg: "bg-blue-500/10",
            Icon: CalendarDays,
          },
          {
            label: t("dashboard.admin.publishedEvents"),
            value: stats.publishedEvents,
            color: "text-green-600",
            iconBg: "bg-green-500/10",
            Icon: BadgeCheck,
          },
          {
            label: t("dashboard.admin.totalRegistrations"),
            value: stats.totalRegistrations,
            color: "text-accent",
            iconBg: "bg-accent/10",
            Icon: Ticket,
          },
        ].map(({ label, value, color, iconBg, Icon }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`mt-1 font-display text-3xl font-semibold ${color} sm:text-4xl`}>
              {value.toLocaleString(getIntlLocale(locale))}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <AdminStatsCharts
        monthlyData={stats.monthlyActivity}
        categoryData={stats.categoryData}
      />
    </div>
  );
}
