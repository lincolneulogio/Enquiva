import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getI18n } from "@/lib/i18n/server";
import { getPlatformRevenue } from "@/actions/admin/plans";
import { getPendingSubscriptionPayments } from "@/actions/billing";
import { AdminRevenuePanel } from "@/components/dashboard/admin/AdminRevenuePanel";
import { AdminSubscriptionPaymentsPanel } from "@/components/dashboard/admin/AdminSubscriptionPaymentsPanel";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

import { getStaffDashboardHome } from "@/lib/navigation/dashboard-paths";

export default async function AdminBillingPage() {
  const { t } = await getI18n();
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "super_admin") redirect(getStaffDashboardHome(session?.user?.role));

  const [revenue, pendingRows] = await Promise.all([
    getPlatformRevenue(),
    getPendingSubscriptionPayments(),
  ]);

  const userIds = [...new Set(pendingRows.map((r) => r.payment.userId))];
  const userRows =
    userIds.length > 0
      ? await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(inArray(users.id, userIds))
      : [];
  const userMap = Object.fromEntries(userRows.map((u) => [u.id, u]));

  const pending = pendingRows.map((row) => ({
    ...row,
    userName: userMap[row.payment.userId]?.name,
    userEmail: userMap[row.payment.userId]?.email,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{t("billing.pageTitle")}</h1>
        <p className="mt-1 text-muted-foreground">{t("billing.pageIntro")}</p>
      </div>

      <AdminSubscriptionPaymentsPanel pending={pending} />

      <AdminRevenuePanel
        paidOrganizerSubscriptions={revenue.paidOrganizerSubscriptions}
        freeOrganizerSubscriptions={revenue.freeOrganizerSubscriptions}
        totals={revenue.totals}
        recent={revenue.recent}
      />
    </div>
  );
}
