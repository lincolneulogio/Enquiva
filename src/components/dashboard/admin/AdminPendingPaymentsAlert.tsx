import Link from "next/link";
import { ShieldAlert, ArrowRight, Crown } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { staffDashboardPath, type StaffDashboardBase } from "@/lib/navigation/dashboard-paths";

type AdminPendingPaymentsAlertProps = {
  count: number;
  subscriptionPendingCount?: number;
  staffBase?: StaffDashboardBase;
};

export async function AdminPendingPaymentsAlert({
  count,
  subscriptionPendingCount = 0,
  staffBase = "/admin",
}: AdminPendingPaymentsAlertProps) {
  const showEvents = count > 0;
  const showSubs = staffBase === "/superadmin" && subscriptionPendingCount > 0;
  if (!showEvents && !showSubs) return null;

  const { t } = await getI18n();

  return (
    <div className="space-y-3">
      {showEvents ? (
        <Link
          href={`${staffDashboardPath(staffBase, "payments")}?status=pending`}
          className="flex items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-4 transition-colors hover:bg-amber-500/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {t("dashboard.admin.pendingPaymentsAlertTitle")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.admin.pendingPaymentsAlertDescription", { count })}
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-amber-700 dark:text-amber-300">
            {t("dashboard.admin.pendingPaymentsAlertAction")}
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      ) : null}

      {showSubs ? (
        <Link
          href={staffDashboardPath(staffBase, "billing")}
          className="flex items-center justify-between gap-4 rounded-2xl border border-violet-500/30 bg-violet-500/5 px-5 py-4 transition-colors hover:bg-violet-500/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {t("dashboard.admin.pendingSubscriptionsAlertTitle")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.admin.pendingSubscriptionsAlertDescription", {
                  count: subscriptionPendingCount,
                })}
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-violet-700 dark:text-violet-300">
            {t("dashboard.admin.pendingSubscriptionsAlertAction")}
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      ) : null}
    </div>
  );
}
