import { Suspense } from "react";
import { CreditCard } from "lucide-react";
import { paymentStatusEnum } from "@/lib/db/schema";
import { getRequestSession } from "@/lib/request-context";
import { getI18n } from "@/lib/i18n/server";
import { ExportDataPanel } from "@/components/dashboard/admin/ExportDataPanel";
import { getExportEventOptions } from "@/actions/exports";
import { getCategories } from "@/actions/events";
import { categoryLabel } from "@/lib/utils";
import { getPaymentStatusLabel } from "@/lib/i18n/core";
import { getMyPlanSummary } from "@/actions/billing";
import { planIncludesFeature } from "@/lib/billing/enforce";
import { EmptyStateCard } from "@/components/ui/EmptyStateCard";
import { PaymentEarningsReportView } from "@/components/payments/PaymentEarningsReport";
import { getPaymentEarningsReport } from "@/lib/payments/earnings-report";
import { fetchOrganizerPayments, type OrganizerPaymentsSearchParams } from "./query";
import { PaymentsTable } from "./table";
import { PendingPaymentsBanner } from "./ui";

interface PageProps {
  searchParams: Promise<OrganizerPaymentsSearchParams>;
}

export default async function OrganizerPaymentsPage({ searchParams }: PageProps) {
  const { locale, t } = await getI18n();
  const params = await searchParams;
  const session = await getRequestSession();
  const organizerId = session!.user.id;
  const planSummary = await getMyPlanSummary();
  const showExports = planIncludesFeature(planSummary.plan, "exports", planSummary.isUnlimited);

  const exportEventOptions = await getExportEventOptions("organizer");
  const exportCategoryOptions = (await getCategories()).map((category) => ({
    value: category.slug,
    label: categoryLabel(category.slug, locale),
  }));
  const exportStatusOptions = ["all", "pending", "approved", "rejected"].map((value) => ({
    value,
    label: value === "all" ? t("common.all") : getPaymentStatusLabel(value, locale),
  }));

  const reportStatus = paymentStatusEnum.enumValues.find(
    (value) => value === params.status,
  );
  const earningsReport = await getPaymentEarningsReport(
    { mode: "organizer", organizerId },
    {
      eventId: params.eventId,
      category: params.category,
      status: reportStatus,
      fromDate: params.fromDate,
      toDate: params.toDate,
    },
  );

  const queryResult = await fetchOrganizerPayments({
    organizerId,
    params,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.payments")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("dashboard.organizer.paymentsIntro")}
        </p>
      </div>

      <PendingPaymentsBanner pendingCount={queryResult.pendingCount} t={t} />

      <Suspense>
        <ExportDataPanel
          resource="payments"
          scope="organizer"
          eventOptions={exportEventOptions}
          categoryOptions={exportCategoryOptions}
          statusOptions={exportStatusOptions}
          showExportActions={showExports}
        />
      </Suspense>

      <PaymentEarningsReportView report={earningsReport} audience="organizer" />

      {queryResult.payments.length === 0 ? (
        <EmptyStateCard
          icon={CreditCard}
          title={t("payments.organizer.emptyTitle")}
          description={t("payments.organizer.emptyDescription")}
          action={{ label: t("payments.organizer.emptyCta"), href: "/organizer/events" }}
        />
      ) : (
        <PaymentsTable
          queryResult={queryResult}
          searchParams={params}
          locale={locale}
          t={t}
        />
      )}
    </div>
  );
}
