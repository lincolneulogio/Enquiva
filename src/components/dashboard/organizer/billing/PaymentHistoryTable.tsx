"use client";

import { History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  type PaymentHistoryRow,
  PAYMENT_STATUS_KEYS,
  PAYMENT_STATUS_STYLES,
} from "./types";

interface PaymentHistoryTableProps {
  history: PaymentHistoryRow[];
  dateLocale: string;
}

export function PaymentHistoryTable({
  history,
  dateLocale,
}: PaymentHistoryTableProps) {
  const t = useTranslations();

  if (history.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">{t("billing.organizer.paymentHistory")}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">{t("billing.organizer.colDate")}</th>
              <th className="pb-2 pr-4 font-medium">{t("billing.organizer.colPlan")}</th>
              <th className="pb-2 pr-4 font-medium">{t("billing.organizer.colAmount")}</th>
              <th className="pb-2 pr-4 font-medium">{t("billing.organizer.colMethod")}</th>
              <th className="pb-2 font-medium">{t("billing.organizer.colStatus")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {history.map(({ payment, plan: paymentPlan }) => (
              <tr key={payment.id}>
                <td className="py-3 pr-4 text-muted-foreground">
                  {new Date(payment.createdAt).toLocaleDateString(dateLocale, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="py-3 pr-4 font-medium text-foreground">{paymentPlan.name}</td>
                <td className="py-3 pr-4 text-foreground">
                  S/ {Number(payment.amount).toFixed(2)}
                </td>
                <td className="py-3 pr-4 capitalize text-muted-foreground">{payment.method}</td>
                <td className="py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      PAYMENT_STATUS_STYLES[payment.status] ?? PAYMENT_STATUS_STYLES.pending,
                    )}
                  >
                    {PAYMENT_STATUS_KEYS[payment.status]
                      ? t(PAYMENT_STATUS_KEYS[payment.status])
                      : payment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
