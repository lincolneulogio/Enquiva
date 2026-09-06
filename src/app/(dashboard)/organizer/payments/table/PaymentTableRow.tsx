import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { getPaymentMethodLabel } from "@/lib/payments/labels";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { PaymentNotesButton } from "@/components/payments/PaymentNotesButton";
import { PaymentStatusSelect } from "@/components/payments/PaymentStatusSelect";
import { PaymentRefundButton } from "@/components/payments/PaymentRefundButton";
import { getPaymentDynamicCaption } from "@/lib/payments/dynamic-caption";
import type { OrganizerPaymentRowData } from "../query/types";

interface PaymentTableRowProps {
  item: OrganizerPaymentRowData;
  locale: "en" | "es";
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function PaymentTableRow({ item, locale, t }: PaymentTableRowProps) {
  const { payment, registration, event, attendee, transportBooking } = item;
  const caption = getPaymentDynamicCaption(
    payment.notes,
    registration.notes,
    transportBooking?.seats ?? null,
    locale,
  );

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-4">
        <Link href={`/events/${event.slug}`} className="font-medium text-foreground hover:text-primary">
          {event.title}
        </Link>
      </td>
      <td className="px-4 py-4 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">{attendee.name ?? t("common.guest")}</div>
        <div>{attendee.email}</div>
      </td>
      <td className="px-4 py-4 text-right text-sm">
        <div className="font-semibold text-foreground">
          {formatCurrency(Number(payment.amount), payment.currency, locale)}
        </div>
        {caption && (
          <div className="text-[10px] text-muted-foreground/80 mt-0.5 whitespace-nowrap">
            {caption}
          </div>
        )}
      </td>
      <td className="px-4 py-4 text-sm text-muted-foreground">
        {getPaymentMethodLabel(payment.method, locale)}
        {payment.gatewayProvider === "culqi" && payment.status === "approved" && (
          <span className="mt-0.5 block text-[10px] text-violet-600 dark:text-violet-400">
            {t("payments.organizer.autoApproved")}
          </span>
        )}
      </td>
      <td className="px-4 py-4">
        <PaymentStatusBadge status={payment.status} />
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-col items-start gap-1">
          {payment.receiptUrl ? (
            <a
              href={payment.receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-primary hover:underline"
            >
              {t("common.viewReceipt")}
            </a>
          ) : payment.method === "culqi" ? (
            <span className="text-xs text-muted-foreground">{t("payments.organizer.noReceiptNeeded")}</span>
          ) : (
            <span className="text-xs text-muted-foreground">{t("common.awaitingReceipt")}</span>
          )}
          {payment.notes && (
            <PaymentNotesButton
              notes={payment.notes}
              eventName={event.title}
              attendeeName={attendee.name ?? undefined}
              amountFormatted={formatCurrency(Number(payment.amount), payment.currency, locale)}
              receiptUrl={payment.receiptUrl}
              receiptFileName={payment.receiptFileName}
            />
          )}
        </div>
      </td>
      <td className="px-4 py-4 min-w-[140px] space-y-2">
        {payment.method === "culqi" && payment.status === "approved" ? (
          <PaymentRefundButton paymentId={payment.id} />
        ) : (
          <PaymentStatusSelect paymentId={payment.id} currentStatus={payment.status} />
        )}
      </td>
    </tr>
  );
}
