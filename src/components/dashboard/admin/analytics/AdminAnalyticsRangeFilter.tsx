import Link from "next/link";
import { cn } from "@/lib/utils";
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
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-muted/40 p-1 text-xs">
      {RANGE_OPTIONS.map((option) => {
        const active = option.value === selectedRange;
        return (
          <Link
            key={option.value}
            href={`${rangeBasePath}?range=${option.value}`}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-200",
              active
                ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:bg-card/40 hover:text-foreground"
            )}
          >
            {t(option.labelKey)}
          </Link>
        );
      })}
    </div>
  );
}
