import { Users, CalendarDays, Ticket, BadgeCheck, Coins } from "lucide-react";
import { getIntlLocale } from "@/lib/i18n/core";
import type { AdminAnalyticsMode, AdminAnalyticsStats } from "./types";

interface AdminAnalyticsSummaryCardsProps {
  mode: AdminAnalyticsMode;
  stats: AdminAnalyticsStats;
  locale: "es" | "en" | string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function SparklineWave({ color = "blue" }: { color?: "blue" | "sky" | "emerald" | "purple" }) {
  const colorMap = {
    blue: {
      stroke: "#2563eb",
      stopStart: "rgba(37, 99, 235, 0.18)",
      stopEnd: "rgba(37, 99, 235, 0.0)",
    },
    sky: {
      stroke: "#0284c7",
      stopStart: "rgba(2, 132, 199, 0.18)",
      stopEnd: "rgba(2, 132, 199, 0.0)",
    },
    emerald: {
      stroke: "#059669",
      stopStart: "rgba(5, 150, 105, 0.18)",
      stopEnd: "rgba(5, 150, 105, 0.0)",
    },
    purple: {
      stroke: "#7c3aed",
      stopStart: "rgba(124, 58, 237, 0.18)",
      stopEnd: "rgba(124, 58, 237, 0.0)",
    },
  };

  const cfg = colorMap[color] || colorMap.blue;
  const gradientId = `summary-sparkline-${color}`;

  return (
    <div className="relative mt-2 h-7 w-full overflow-hidden">
      <svg
        className="h-full w-full overflow-visible"
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cfg.stopStart} />
            <stop offset="100%" stopColor={cfg.stopEnd} />
          </linearGradient>
        </defs>
        <path
          d="M0,19 C25,19 45,18 65,12 C80,8 90,6 100,5 L100,24 L0,24 Z"
          fill={`url(#${gradientId})`}
        />
        <path
          d="M0,19 C25,19 45,18 65,12 C80,8 90,6 100,5"
          stroke={cfg.stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

export function AdminAnalyticsSummaryCards({
  mode,
  stats,
  locale,
  t,
}: AdminAnalyticsSummaryCardsProps) {
  const safeLocale: "es" | "en" = locale === "en" ? "en" : "es";
  type SummaryCardItem = {
    label: string;
    value: number;
    Icon: React.ComponentType<{ className?: string }>;
    color: string;
    iconBg: string;
    sparklineColor: "blue" | "sky" | "purple" | "emerald";
    subtext?: string;
    statusBadge?: string;
    format?: "currency";
  };

  const summaryCards: SummaryCardItem[] =
    mode === "own"
      ? [
          {
            label: t("dashboard.admin.totalEvents"),
            value: stats.totalEvents,
            Icon: CalendarDays,
            color: "text-blue-600 dark:text-blue-400",
            iconBg: "border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400",
            sparklineColor: "sky" as const,
            subtext: stats.totalEvents === 1 ? t("dashboard.admin.statsCreatedUnit") : t("dashboard.admin.statsCreatedUnitPlural"),
          },
          {
            label: t("dashboard.admin.publishedEvents"),
            value: stats.publishedEvents,
            Icon: BadgeCheck,
            color: "text-emerald-600 dark:text-emerald-400",
            iconBg: "border border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400",
            sparklineColor: "emerald" as const,
            statusBadge: t("dashboard.admin.statsOnline100"),
          },
          {
            label: t("dashboard.admin.totalRegistrations"),
            value: stats.totalRegistrations,
            Icon: Ticket,
            color: "text-purple-600 dark:text-purple-400",
            iconBg: "border border-purple-100 bg-purple-50 text-purple-600 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-400",
            sparklineColor: "purple" as const,
            subtext: stats.totalRegistrations === 1 ? t("dashboard.admin.statsAttendeeUnit") : t("dashboard.admin.statsAttendeeUnitPlural"),
          },
          {
            label: t("dashboard.admin.statsTotalRevenue"),
            value: stats.totalRevenue,
            Icon: Coins,
            color: "text-emerald-600 dark:text-emerald-400",
            iconBg: "border border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400",
            format: "currency" as const,
            sparklineColor: "emerald" as const,
          },
        ]
      : [
          {
            label: t("dashboard.admin.totalUsers"),
            value: stats.totalUsers,
            Icon: Users,
            color: "text-blue-600 dark:text-blue-400",
            iconBg: "border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400",
            sparklineColor: "blue" as const,
            subtext: t("dashboard.admin.statsRegisteredUnit"),
          },
          {
            label: t("dashboard.admin.totalEvents"),
            value: stats.totalEvents,
            Icon: CalendarDays,
            color: "text-sky-600 dark:text-sky-400",
            iconBg: "border border-sky-100 bg-sky-50 text-sky-600 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-400",
            sparklineColor: "sky" as const,
            subtext: stats.totalEvents === 1 ? t("dashboard.admin.statsCreatedUnit") : t("dashboard.admin.statsCreatedUnitPlural"),
          },
          {
            label: t("dashboard.admin.totalRegistrations"),
            value: stats.totalRegistrations,
            Icon: Ticket,
            color: "text-purple-600 dark:text-purple-400",
            iconBg: "border border-purple-100 bg-purple-50 text-purple-600 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-400",
            sparklineColor: "purple" as const,
            subtext: stats.totalRegistrations === 1 ? t("dashboard.admin.statsAttendeeUnit") : t("dashboard.admin.statsAttendeeUnitPlural"),
          },
        ];

  return (
    <div
      className={`grid gap-4 ${mode === "own" ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}
    >
      {summaryCards.map(({ label, value, Icon, color, iconBg, sparklineColor, subtext, statusBadge, ...rest }) => {
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
          <div
            key={label}
            className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-300 hover:border-primary/40 hover:shadow-md sm:p-6"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>

              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  {format === "currency"
                    ? `S/. ${Number(value).toLocaleString(getIntlLocale(safeLocale), {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : Number(value).toLocaleString(getIntlLocale(safeLocale))}
                </span>
                {subtext ? (
                  <span className="text-xs font-medium text-muted-foreground">{subtext}</span>
                ) : null}
                {statusBadge ? (
                  <span className="ml-1 inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {statusBadge}
                  </span>
                ) : null}
              </div>

              <SparklineWave color={sparklineColor} />
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
              {deltaKey != null ? (
                <>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      deltaKey > 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : deltaKey < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-muted-foreground"
                    }`}
                  >
                    {deltaKey > 0 ? "+" : ""}
                    {deltaKey}%
                  </span>
                  <span className="text-[11px] text-muted-foreground">{periodLabel || ""}</span>
                </>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  {t("dashboard.admin.statsActiveInSystem")}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
