import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getI18n } from "@/lib/i18n/server";
import { getPlatformRevenue } from "@/actions/admin/plans";
import { AdminRevenuePanel } from "@/components/dashboard/admin/AdminRevenuePanel";
import { CommissionSettlementPanel } from "@/components/dashboard/admin/CommissionSettlementPanel";
import { getCommissionSettlementSummary } from "@/lib/billing/commission-settlement";
import { CommissionInvoiceService } from "@/lib/billing/commission-invoice.service";

import { getStaffDashboardHome, staffDashboardPath } from "@/lib/navigation/dashboard-paths";
import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";
import Link from "next/link";

export default async function AdminBillingPage() {
  const { t } = await getI18n();
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "super_admin") redirect(getStaffDashboardHome(session?.user?.role));

  const staffBase = await getStaffBaseFromRequest();
  const [revenue, commissionSummary, invoices] = await Promise.all([
    getPlatformRevenue(),
    getCommissionSettlementSummary(),
    CommissionInvoiceService.listRecent(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{t("billing.pageTitle")}</h1>
        <p className="mt-1 text-muted-foreground">{t("billing.pageIntro")}</p>
        <Link
          href={staffDashboardPath(staffBase, "payments")}
          className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
        >
          {t("dashboard.admin.saasBillingEventsLink")} →
        </Link>
      </div>

      <AdminRevenuePanel
        paidOrganizerSubscriptions={revenue.paidOrganizerSubscriptions}
        freeOrganizerSubscriptions={revenue.freeOrganizerSubscriptions}
        totals={revenue.totals}
        recent={revenue.recent}
      />

      <CommissionSettlementPanel summary={commissionSummary} invoices={invoices} />
    </div>
  );
}
