import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getI18n } from "@/lib/i18n/server";
import { getPaymentStatusLabel } from "@/lib/i18n/core";
import { ExportDataPanel } from "@/components/dashboard/admin/ExportDataPanel";
import { getExportEventOptions } from "@/actions/exports";
import { getCategories } from "@/actions/events";
import { categoryLabel } from "@/lib/utils";
import { resolveAdminScope } from "@/lib/organizations/admin-scope";
import { staffDashboardPath } from "@/lib/navigation/dashboard-paths";
import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";
import { getRequestSession } from "@/lib/request-context";
import { normalizeRole } from "@/lib/auth/rbac";
import { PaymentEarningsReportView } from "@/components/payments/PaymentEarningsReport";
import { PaymentsTable } from "./table";
import { fetchAdminPaymentsData, type AdminPaymentsQueryParams } from "./query";

interface AdminPaymentsPageProps {
  searchParams: Promise<AdminPaymentsQueryParams & { page?: string }>;
}

const PAGE_SIZE = 10;

export default async function AdminPaymentsPage({
  searchParams,
}: AdminPaymentsPageProps) {
  const { locale, t } = await getI18n();
  const session = await getRequestSession();
  if (!session?.user) redirect("/login");

  const role = normalizeRole(session.user.role);
  const staffBase = await getStaffBaseFromRequest();
  const params = await searchParams;
  const exportEventOptions = await getExportEventOptions("admin");
  const exportCategoryOptions = (await getCategories()).map((category) => ({
    value: category.slug,
    label: categoryLabel(category.slug, locale),
  }));
  const exportStatusOptions = ["all", "pending", "approved", "rejected"].map(
    (value) => ({
      value,
      label:
        value === "all"
          ? t("common.all")
          : getPaymentStatusLabel(value, locale),
    }),
  );

  const requestedPage = Number(params.page ?? "1");
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.floor(requestedPage)
      : 1;

  const adminScope = await resolveAdminScope();
  const entityOrgId = adminScope.mode === "org" ? adminScope.organizationId : null;

  const { total, totalPages, safePage, offset, allPayments, earningsReport } =
    await fetchAdminPaymentsData({
      params,
      adminScope,
      currentPage,
      pageSize: PAGE_SIZE,
    });

  const isFiltered = !!(
    params.eventId ||
    params.category ||
    (params.status && params.status !== "all") ||
    params.fromDate ||
    params.toDate
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          {staffBase === "/superadmin"
            ? t("dashboard.admin.eventPaymentsTitle")
            : t("common.payments")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {staffBase === "/superadmin"
            ? t("dashboard.admin.eventPaymentsIntro")
            : t("dashboard.admin.paymentsIntro")}
          {isFiltered && (
            <span className="ml-2 text-xs text-primary font-medium">
              ({locale === "en" ? "filtered" : "filtrado"})
            </span>
          )}
        </p>
        {staffBase === "/superadmin" ? (
          <Link
            href={staffDashboardPath(staffBase, "billing")}
            className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
          >
            {t("dashboard.admin.eventPaymentsSaasLink")} →
          </Link>
        ) : null}
      </div>

      <Suspense>
        <ExportDataPanel
          resource="payments"
          scope="admin"
          eventOptions={exportEventOptions}
          categoryOptions={exportCategoryOptions}
          statusOptions={exportStatusOptions}
        />
      </Suspense>

      <PaymentEarningsReportView
        report={earningsReport}
        audience={adminScope.mode === "platform" ? "platform" : "entity"}
      />

      <PaymentsTable
        payments={allPayments}
        total={total}
        isFiltered={isFiltered}
        locale={locale}
        staffBase={staffBase}
        safePage={safePage}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
        rowStart={offset}
        sessionUserId={session.user.id}
        role={role}
        entityOrgId={entityOrgId}
        params={params}
        labels={{
          showingPayments: t("dashboard.admin.showingPayments", { count: total }),
          noPaymentsYet: t("dashboard.member.noPaymentsYet"),
          noPaymentsFilter: locale === "en" ? "No payments match your filters." : "Ningún pago coincide con los filtros.",
          noPaymentsDefault: locale === "en" ? "Payments will appear here when made." : "Los pagos aparecerán aquí cuando se realicen.",
          paymentsLedger: locale === "en" ? "Payments Ledger" : "Libro de Pagos",
          scrollHorizontally: locale === "en" ? "Scroll horizontally to view all columns" : "Desliza horizontalmente para ver todas las columnas",
          colPayments: t("common.payments"),
          colTime: locale === "en" ? "Time" : "Hora",
          colEvent: t("common.event"),
          colAttendee: t("common.attendee"),
          colAmount: t("common.amount"),
          colMethod: t("common.method"),
          colReference: locale === "en" ? "Reference" : "Referencia",
          colStatus: t("common.status"),
          colUpdate: t("common.update"),
          colReceipt: t("common.receipt"),
          viewReceipt: t("common.viewReceipt"),
          noReceipt: t("common.noReceipt"),
          guest: t("common.guest"),
        }}
      />
    </div>
  );
}
