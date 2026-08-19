import { redirect } from "next/navigation";
import { getRequestSession } from "@/lib/request-context";
import { getI18n } from "@/lib/i18n/server";
import { getPlatformRevenue } from "@/actions/admin/plans";
import { AdminRevenuePanel } from "@/components/dashboard/admin/AdminRevenuePanel";
import { CommissionSettlementPanel } from "@/components/dashboard/admin/CommissionSettlementPanel";
import { getCommissionSettlementSummary } from "@/lib/billing/commission-settlement";
import { CommissionInvoiceService } from "@/lib/billing/commission-invoice.service";

import { getStaffDashboardHome, staffDashboardPath } from "@/lib/navigation/dashboard-paths";
import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";
import Link from "next/link";

interface AdminBillingPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminBillingPage({ searchParams }: AdminBillingPageProps) {
  const { t } = await getI18n();
  const session = await getRequestSession();
  if (session?.user?.role !== "super_admin") redirect(getStaffDashboardHome(session?.user?.role));

  const params = await searchParams;
  const requestedPage = Number(params.page ?? "1");
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

  const staffBase = await getStaffBaseFromRequest();
  const billingPath = staffDashboardPath(staffBase, "billing");
  const [revenue, commissionSummary, invoices] = await Promise.all([
    getPlatformRevenue(currentPage),
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
        recentTotal={revenue.recentTotal}
        recentPage={revenue.recentPage}
        recentPageSize={revenue.recentPageSize}
        billingPath={billingPath}
      />

      <CommissionSettlementPanel summary={commissionSummary} invoices={invoices} />
    </div>
  );
}
