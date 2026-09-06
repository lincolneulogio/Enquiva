import Link from "next/link";
import { Coins, Sparkles, TrendingUp } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale } from "@/lib/i18n/core";
import type { DashboardRevenueSnapshot } from "@/lib/analytics/platform-revenue";
import { staffDashboardPath, type StaffDashboardBase } from "@/lib/navigation/dashboard-paths";

export type AdminRevenueSplitCardsProps = {
  snapshot: DashboardRevenueSnapshot;
  staffBase?: StaffDashboardBase;
};

export async function AdminRevenueSplitCards({
  snapshot,
  staffBase = "/admin",
}: AdminRevenueSplitCardsProps) {
  const { locale, t } = await getI18n();
  const intl = getIntlLocale(locale);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Event Revenue Card */}
      <Link
        href={staffDashboardPath(staffBase, "payments")}
        className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-300 hover:border-emerald-500/40 hover:shadow-md sm:p-6"
      >
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Coins className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t("dashboard.admin.revenueEventsTitle")}
                </p>
                <span className="inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {t("dashboard.admin.statsDirectSales")}
                </span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              <TrendingUp className="h-3 w-3" />
              +100%
            </span>
          </div>

          <div className="mt-4">
            <p className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              S/.{" "}
              {snapshot.eventRevenue.toLocaleString(intl, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
              {t("dashboard.admin.revenueEventsDescription")}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
          <span className="text-muted-foreground">{t("dashboard.admin.statsConsolidatedFlow")}</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {t("dashboard.admin.statsSettlable100")}
          </span>
        </div>
      </Link>

      {/* SaaS Revenue Card */}
      <Link
        href={staffDashboardPath(staffBase, "billing")}
        className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-300 hover:border-violet-500/40 hover:shadow-md sm:p-6"
      >
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t("dashboard.admin.revenueSaasTitle")}
                </p>
                <span className="inline-flex items-center rounded-full border border-violet-200/80 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-300">
                  {t("dashboard.admin.statsCommissionsSubscriptions")}
                </span>
              </div>
            </div>

            <span className="inline-flex items-center rounded-full border border-violet-200/80 bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-300">
              {t("dashboard.admin.statsNetFlow")}
            </span>
          </div>

          <div className="mt-4">
            <p className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              S/.{" "}
              {snapshot.platformRevenue.toLocaleString(intl, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
              {t("dashboard.admin.revenueSaasDescription")}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
          <span className="text-muted-foreground">{t("dashboard.admin.statsEstimatedCommission8")}</span>
          <span className="font-bold text-violet-600 dark:text-violet-400">
            {t("dashboard.admin.statsRetainedRevenue")}
          </span>
        </div>
      </Link>
    </div>
  );
}
