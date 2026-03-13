import Link from "next/link";
import { getAdminPayments } from "@/actions/payments";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { PaymentStatusSelect } from "@/components/payments/PaymentStatusSelect";
import { formatCurrency } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { getIntlLocale } from "@/lib/i18n/core";

export default async function AdminPaymentsPage() {
  const { locale, t } = await getI18n();
  const payments = await getAdminPayments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.payments")}</h1>
        <p className="mt-1 text-muted-foreground">
          {t("dashboard.admin.paymentsIntro")}
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{t("dashboard.admin.showingPayments", { count: payments.length })}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.payments")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.event")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.route")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.attendee")}</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t("common.amount")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.method")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.status")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.update")}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.receipt")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map(({ payment, event, attendee, transportRoute }) => (
                <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="text-xs text-muted-foreground">#{payment.id.slice(0, 8)}</div>
                    <div className="text-foreground text-sm font-medium">
                      {new Date(payment.createdAt).toLocaleDateString(getIntlLocale(locale), {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/events/${event.slug}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {event.title}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {transportRoute?.name ?? t("common.noDataDash")}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    <div className="font-medium text-foreground">{attendee.name ?? t("common.guest")}</div>
                    <div>{attendee.email}</div>
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-semibold text-foreground">
                    {formatCurrency(Number(payment.amount), payment.currency, locale)}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{payment.method}</td>
                  <td className="px-4 py-4">
                    <PaymentStatusBadge status={payment.status} />
                  </td>
                  <td className="px-4 py-4 max-w-[180px]">
                    <PaymentStatusSelect
                      paymentId={payment.id}
                      currentStatus={payment.status}
                    />
                  </td>
                  <td className="px-4 py-4">
                    {payment.receiptUrl ? (
                      <a
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {t("common.viewReceipt")}
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t("common.noReceipt")}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
