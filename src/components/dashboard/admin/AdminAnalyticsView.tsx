import Link from "next/link";
import { AdminStatsCharts, AdminStatsSectionHeader, AdminOwnEventsEmptyState } from "@/components/dashboard";
import { AdminAnalyticsExportBar } from "@/components/dashboard/admin/AdminAnalyticsExportBar";
import type { AdminStatsRange } from "@/lib/analytics/admin";
import { Users, CalendarDays, Ticket, BadgeCheck, Coins } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale } from "@/lib/i18n/core";

const RANGE_OPTIONS: { value: AdminStatsRange; labelKey: string }[] = [
  { value: "30d", labelKey: "dashboard.admin.last30Days" },
  { value: "90d", labelKey: "dashboard.admin.last90Days" },
  { value: "12m", labelKey: "dashboard.admin.last12Months" },
  { value: "all", labelKey: "dashboard.admin.allTime" },
];

export type AdminAnalyticsMode = "global" | "entity" | "own";

type AdminAnalyticsStats = Awaited<
  ReturnType<typeof import("@/lib/analytics/admin").getAdminDashboardStats>
>;

type AdminAnalyticsViewProps = {
  mode: AdminAnalyticsMode;
  stats: AdminAnalyticsStats;
  selectedRange: AdminStatsRange;
  rangeBasePath: string;
  exportTitle?: string;
  showExport?: boolean;
};

export async function AdminAnalyticsView({
  mode,
  stats,
  selectedRange,
  rangeBasePath,
  exportTitle = "",
  showExport = false,
}: AdminAnalyticsViewProps) {
  const { locale, t } = await getI18n();

  const rangeLabelKey = RANGE_OPTIONS.find((o) => o.value === selectedRange)?.labelKey;

  if (mode === "own" && stats.totalEvents === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => {
            const active = option.value === selectedRange;
            return (
              <Link
                key={option.value}
                href={`${rangeBasePath}?range=${option.value}`}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary"
                }`}
              >
                {t(option.labelKey)}
              </Link>
            );
          })}
        </div>
        <AdminOwnEventsEmptyState />
      </div>
    );
  }

  const globalScope = mode === "entity" ? "entity" : mode === "own" ? "own-events" : "platform-global";
  const eventsScope = mode === "entity" ? "entity" : mode === "own" ? "own-events" : "platform-events";

  const eventStats = [
    { label: t("eventStatus.published"), value: stats.publishedEvents, color: "bg-green-500" },
    { label: t("eventStatus.draft"), value: stats.draftEvents, color: "bg-yellow-500" },
    { label: t("eventStatus.cancelled"), value: stats.cancelledEvents, color: "bg-red-500" },
  ];

  const userStats = [
    { label: t("roles.member"), value: stats.memberCount, color: "bg-primary" },
    { label: t("roles.organizer"), value: stats.organizerCount, color: "bg-blue-500" },
  ];

  const summaryCards =
    mode === "own"
      ? [
          {
            label: t("dashboard.admin.totalEvents"),
            value: stats.totalEvents,
            Icon: CalendarDays,
            color: "text-blue-600",
            iconBg: "bg-blue-500/10",
          },
          {
            label: t("dashboard.admin.publishedEvents"),
            value: stats.publishedEvents,
            Icon: BadgeCheck,
            color: "text-green-600",
            iconBg: "bg-green-500/10",
          },
          {
            label: t("dashboard.admin.totalRegistrations"),
            value: stats.totalRegistrations,
            Icon: Ticket,
            color: "text-accent",
            iconBg: "bg-accent/10",
          },
          {
            label: t("dashboard.admin.statsTotalRevenue"),
            value: stats.totalRevenue,
            Icon: Coins,
            color: "text-emerald-600",
            iconBg: "bg-emerald-500/10",
            format: "currency" as const,
          },
        ]
      : [
          {
            label: t("dashboard.admin.totalUsers"),
            value: stats.totalUsers,
            Icon: Users,
            color: "text-primary",
            iconBg: "bg-primary/10",
          },
          {
            label: t("dashboard.admin.totalEvents"),
            value: stats.totalEvents,
            Icon: CalendarDays,
            color: "text-blue-600",
            iconBg: "bg-blue-500/10",
          },
          {
            label: t("dashboard.admin.totalRegistrations"),
            value: stats.totalRegistrations,
            Icon: Ticket,
            color: "text-accent",
            iconBg: "bg-accent/10",
          },
        ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {showExport && exportTitle ? (
        <AdminAnalyticsExportBar stats={stats} mode={mode} title={exportTitle} />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((option) => {
          const active = option.value === selectedRange;
          return (
            <Link
              key={option.value}
              href={`${rangeBasePath}?range=${option.value}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary"
              }`}
            >
              {t(option.labelKey)}
            </Link>
          );
        })}
        </div>
        {rangeLabelKey ? (
          <p className="text-xs text-muted-foreground sm:text-right">
            {t("dashboard.admin.analyticsShowingRange", { range: t(rangeLabelKey) })}
          </p>
        ) : null}
      </div>

      <AdminStatsSectionHeader scope={globalScope} />

      <div
        className={`grid gap-4 ${mode === "own" ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}
      >
        {summaryCards.map(({ label, value, Icon, color, iconBg, ...rest }) => {
          const format = "format" in rest ? rest.format : undefined;
          const deltaKey =
            label === t("dashboard.admin.totalUsers")
              ? stats.comparisons.totalUsers
              : label === t("dashboard.admin.totalEvents")
                ? stats.comparisons.totalEvents
                : label === t("dashboard.admin.totalRegistrations")
                  ? stats.comparisons.totalRegistrations
                  : label === t("dashboard.admin.statsTotalRevenue")
                    ? stats.comparisons.totalRevenue
                    : null;
          const periodLabel =
            deltaKey != null ? t(`dashboard.admin.${stats.comparisons.periodLabelKey}`) : undefined;

          return (
          <div key={label} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`mt-1 font-display text-3xl font-semibold ${color} sm:text-4xl`}>
              {format === "currency"
                ? `S/. ${Number(value).toLocaleString(getIntlLocale(locale), {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : Number(value).toLocaleString(getIntlLocale(locale))}
            </p>
            {deltaKey != null ? (
              <p
                className={`mt-2 text-xs ${
                  deltaKey > 0
                    ? "text-emerald-600"
                    : deltaKey < 0
                      ? "text-red-600"
                      : "text-muted-foreground"
                }`}
              >
                {deltaKey > 0 ? "+" : ""}
                {deltaKey}% {periodLabel}
              </p>
            ) : null}
          </div>
        );
        })}
      </div>

      {mode !== "own" ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="mb-4 font-semibold text-foreground">{t("dashboard.admin.eventsByStatus")}</h2>
            <div className="space-y-3">
              {eventStats.map(({ label, value, color }) => {
                const pct = stats.totalEvents > 0 ? Math.round((value / stats.totalEvents) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground">
                        {value} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="mb-4 font-semibold text-foreground">{t("dashboard.admin.usersByRole")}</h2>
            <div className="space-y-3">
              {userStats.map(({ label, value, color }) => {
                const pct = stats.totalUsers > 0 ? Math.round((value / stats.totalUsers) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground">
                        {value} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <h2 className="mb-4 font-semibold text-foreground">{t("dashboard.admin.eventsByStatus")}</h2>
          <div className="space-y-3">
            {eventStats.map(({ label, value, color }) => {
              const pct = stats.totalEvents > 0 ? Math.round((value / stats.totalEvents) * 100) : 0;
              return (
                <div key={label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">
                      {value} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mode !== "own" ? <AdminStatsSectionHeader scope={eventsScope} className="pt-2" /> : null}

      <AdminStatsCharts
        monthlyData={stats.monthlyActivity}
        categoryData={stats.categoryData}
        paymentMethodsStats={stats.paymentMethodsStats}
        totalRevenue={stats.totalRevenue}
        pendingPaymentsCount={stats.pendingPaymentsCount}
        avgPayment={stats.avgPayment}
        totalCapacity={stats.totalCapacity}
        occupiedSeats={stats.occupiedSeats}
        checkedInCount={stats.checkedInCount}
        registeredCount={stats.registeredCount}
        waitlistedCount={stats.waitlistedCount}
        approvedPaymentsCount={stats.approvedPaymentsCount}
        totalEventViews={stats.totalEventViews}
        hideUserSeries={mode === "own"}
      />
    </div>
  );
}
