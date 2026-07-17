import {
  CircleDollarSign,
  Clock3,
  Landmark,
  ReceiptText,
  TriangleAlert,
} from "lucide-react";
import type { PaymentEarningsReport } from "@/lib/payments/earnings-report";
import { getI18n } from "@/lib/i18n/server";
import { formatCurrency } from "@/lib/utils";

type PaymentEarningsReportProps = {
  report: PaymentEarningsReport;
  audience: "organizer" | "entity" | "platform";
};

export async function PaymentEarningsReportView({
  report,
  audience,
}: PaymentEarningsReportProps) {
  const { locale, t } = await getI18n();
  const currencies =
    report.currencies.length > 0
      ? report.currencies
      : [
          {
            currency: "PEN",
            approvedGross: 0,
            platformCommission: 0,
            organizerNet: 0,
            pendingGross: 0,
            approvedPayments: 0,
            pendingPayments: 0,
            unsettledApprovedPayments: 0,
          },
        ];
  const unsettledCount = currencies.reduce(
    (total, currency) => total + currency.unsettledApprovedPayments,
    0,
  );

  return (
    <section className="space-y-4" aria-labelledby="payment-earnings-title">
      <div>
        <h2 id="payment-earnings-title" className="text-xl font-semibold text-foreground">
          {t("payments.earnings.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {audience === "platform"
            ? t("payments.earnings.platformDescription")
            : audience === "entity"
              ? t("payments.earnings.entityDescription")
              : t("payments.earnings.organizerDescription")}
        </p>
      </div>

      {currencies.map((summary) => {
        const cards = [
          {
            label: t("payments.earnings.gross"),
            value: summary.approvedGross,
            help: t("payments.earnings.grossHelp", {
              count: summary.approvedPayments,
            }),
            Icon: ReceiptText,
            tone: "text-sky-600 bg-sky-500/10",
          },
          {
            label: t("payments.earnings.commission"),
            value: summary.platformCommission,
            help: t("payments.earnings.commissionHelp"),
            Icon: Landmark,
            tone: "text-amber-600 bg-amber-500/10",
          },
          {
            label:
              summary.unsettledApprovedPayments > 0
                ? t("payments.earnings.provisionalNet")
                : t("payments.earnings.net"),
            value: summary.organizerNet,
            help: t("payments.earnings.netHelp"),
            Icon: CircleDollarSign,
            tone: "text-emerald-600 bg-emerald-500/10",
          },
          {
            label: t("payments.earnings.pending"),
            value: summary.pendingGross,
            help: t("payments.earnings.pendingHelp", {
              count: summary.pendingPayments,
            }),
            Icon: Clock3,
            tone: "text-violet-600 bg-violet-500/10",
          },
        ];

        return (
          <div key={summary.currency} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ label, value, help, Icon, tone }) => (
              <article key={label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {formatCurrency(value, summary.currency, locale)}
                    </p>
                  </div>
                  <span className={`rounded-xl p-2 ${tone}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{help}</p>
              </article>
            ))}
          </div>
        );
      })}

      {unsettledCount > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50/70 p-4 text-sm dark:border-amber-900/50 dark:bg-amber-950/20">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-amber-900 dark:text-amber-200">
            {t("payments.earnings.unsettledWarning", { count: unsettledCount })}
          </p>
        </div>
      )}

      {report.events.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h3 className="font-semibold text-foreground">
              {t("payments.earnings.byEvent")}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">{t("common.event")}</th>
                  {audience !== "organizer" && (
                    <th className="px-4 py-3">{t("payments.earnings.organizer")}</th>
                  )}
                  <th className="px-4 py-3 text-right">{t("payments.earnings.gross")}</th>
                  <th className="px-4 py-3 text-right">{t("payments.earnings.commission")}</th>
                  <th className="px-4 py-3 text-right">{t("payments.earnings.net")}</th>
                  <th className="px-4 py-3 text-right">{t("payments.earnings.pending")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {report.events.map((row) => (
                  <tr key={`${row.eventId}:${row.currency}`} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{row.eventTitle}</td>
                    {audience !== "organizer" && (
                      <td className="px-4 py-3 text-muted-foreground">{row.organizerName}</td>
                    )}
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(row.approvedGross, row.currency, locale)}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-700 dark:text-amber-400">
                      {formatCurrency(row.platformCommission, row.currency, locale)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(row.organizerNet, row.currency, locale)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatCurrency(row.pendingGross, row.currency, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
