import { Users, CalendarDays, Ticket, BadgeCheck, Coins } from "lucide-react";
import { getIntlLocale } from "@/lib/i18n/core";
import type { AdminAnalyticsMode, AdminAnalyticsStats } from "./types";

interface AdminAnalyticsSummaryCardsProps {
  mode: AdminAnalyticsMode;
  stats: AdminAnalyticsStats;
  locale: "es" | "en" | string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function AdminAnalyticsSummaryCards({
  mode,
  stats,
  locale,
  t,
}: AdminAnalyticsSummaryCardsProps) {
  const safeLocale: "es" | "en" = locale === "en" ? "en" : "es";
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
                ? `S/. ${Number(value).toLocaleString(getIntlLocale(safeLocale), {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : Number(value).toLocaleString(getIntlLocale(safeLocale))}
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
  );
}
