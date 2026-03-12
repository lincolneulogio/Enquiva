import { AdminStatsCharts } from "@/components/dashboard/AdminStatsCharts";
import { Users, CalendarDays, BadgeCheck, Ticket } from "lucide-react";
import { getAdminDashboardStats } from "@/lib/analytics/admin";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Platform Overview
        </h1>
        <p className="mt-1 text-muted-foreground">
          Monitor all activity across FaithEvents
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Users",
            value: stats.totalUsers,
            color: "text-primary",
            iconBg: "bg-primary/10",
            Icon: Users,
          },
          {
            label: "Total Events",
            value: stats.totalEvents,
            color: "text-blue-600",
            iconBg: "bg-blue-500/10",
            Icon: CalendarDays,
          },
          {
            label: "Published Events",
            value: stats.publishedEvents,
            color: "text-green-600",
            iconBg: "bg-green-500/10",
            Icon: BadgeCheck,
          },
          {
            label: "Total Registrations",
            value: stats.totalRegistrations,
            color: "text-accent",
            iconBg: "bg-accent/10",
            Icon: Ticket,
          },
        ].map(({ label, value, color, iconBg, Icon }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-6">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`mt-1 font-display text-4xl font-semibold ${color}`}>
              {value.toLocaleString()}
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
