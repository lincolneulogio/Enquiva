import Link from "next/link";
import type { AdminStatsRange } from "@/lib/analytics/admin";

export const RANGE_OPTIONS: { value: AdminStatsRange; labelKey: string }[] = [
  { value: "30d", labelKey: "dashboard.admin.last30Days" },
  { value: "90d", labelKey: "dashboard.admin.last90Days" },
  { value: "12m", labelKey: "dashboard.admin.last12Months" },
  { value: "all", labelKey: "dashboard.admin.allTime" },
];

interface AdminAnalyticsRangeFilterProps {
  selectedRange: AdminStatsRange;
  rangeBasePath: string;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function AdminAnalyticsRangeFilter({
  selectedRange,
  rangeBasePath,
  t,
}: AdminAnalyticsRangeFilterProps) {
  const rangeLabelKey = RANGE_OPTIONS.find((o) => o.value === selectedRange)?.labelKey;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {RANGE_OPTIONS.map((option) => {
          const active = option.value === selectedRange;
          return (
            <Link
              key={option.value}
              href={`${rangeBasePath}?range=${option.value}`}
              className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-all duration-200 ${
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-border/80 bg-card text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              {t(option.labelKey)}
            </Link>
          );
        })}
      </div>
      {rangeLabelKey ? (
        <p className="text-xs font-medium text-muted-foreground sm:text-right">
          {t("dashboard.admin.analyticsShowingRange", { range: t(rangeLabelKey) })}
        </p>
      ) : null}
    </div>
  );
}
