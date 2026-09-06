import Link from "next/link";
import { getIntlLocale } from "@/lib/i18n/core";
import { formatCurrency } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { PaymentStatusSelect } from "@/components/payments/PaymentStatusSelect";
import { PaymentNotesButton } from "@/components/payments/PaymentNotesButton";

interface PaymentTableRowProps {
  payment: {
    id: string;
    status: "pending" | "approved" | "rejected";
    method: string;
    amount: string;
    currency: string;
    reference: string | null;
    receiptUrl: string | null;
    receiptFileName: string | null;
    notes: string | null;
    createdAt: Date;
  };
  registration: {
    notes: string | null;
    contactPhone: string | null;
  };
  event: {
    title: string;
    slug: string;
  };
  attendee: {
    name: string | null;
    email: string | null;
  };
  transportBooking: {
    seats: number;
  } | null;
  index: number;
  rowStart: number;
  locale: "en" | "es";
  canUpdateStatus: boolean;
  dynamicCaption: string | null;
  viewReceiptLabel: string;
  noReceiptLabel: string;
  guestLabel: string;
}

export function PaymentTableRow({
  payment,
  registration,
  event,
  attendee,
  index,
  rowStart,
  locale,
  canUpdateStatus,
  dynamicCaption,
  viewReceiptLabel,
  noReceiptLabel,
  guestLabel,
}: PaymentTableRowProps) {
  const intlLocale = getIntlLocale(locale);

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-4 text-muted-foreground">
        {rowStart + index + 1}
      </td>
      <td className="px-4 py-4">
        <div className="text-foreground text-sm font-medium">
          {new Date(payment.createdAt).toLocaleDateString(intlLocale, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="text-foreground text-sm font-medium whitespace-nowrap">
          {new Date(payment.createdAt).toLocaleTimeString(intlLocale, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })}
        </div>
      </td>
      <td className="px-4 py-4">
        <Link
          href={`/events/${event.slug}`}
          className="font-medium text-foreground hover:text-primary transition-colors block truncate"
          title={event.title}
        >
          {event.title}
        </Link>
      </td>
      <td className="px-4 py-4 text-sm text-muted-foreground">
        <div className="font-medium text-foreground truncate" title={attendee.name ?? ""}>
          {attendee.name ?? guestLabel}
        </div>
        <div className="text-xs text-muted-foreground truncate" title={attendee.email ?? ""}>
          {attendee.email}
        </div>
        {registration.contactPhone && (
          <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">
            {registration.contactPhone}
          </div>
        )}
      </td>
      <td className="px-4 py-4 text-right text-sm">
        <div className="font-semibold text-foreground">
          {formatCurrency(Number(payment.amount), payment.currency, locale)}
        </div>
        {dynamicCaption && (
          <div className="text-[10px] text-muted-foreground/80 mt-0.5 truncate" title={dynamicCaption}>
            {dynamicCaption}
          </div>
        )}
      </td>
      <td className="px-4 py-4 text-sm text-muted-foreground uppercase font-mono">
        {payment.method}
      </td>
      <td className="px-4 py-4 text-sm text-muted-foreground font-mono truncate" title={payment.reference ?? ""}>
        {payment.reference || <span className="text-muted-foreground/40">—</span>}
      </td>
      <td className="px-4 py-4">
        <PaymentStatusBadge status={payment.status} />
      </td>
      <td className="px-4 py-4 max-w-[170px]">
        {canUpdateStatus ? (
          <PaymentStatusSelect
            paymentId={payment.id}
            currentStatus={payment.status}
          />
        ) : (
          <span className="text-xs text-muted-foreground">
            {locale === "en" ? "View only" : "Solo lectura"}
          </span>
        )}
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-col gap-1 items-start">
          {payment.receiptUrl ? (
            <a
              href={payment.receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-primary hover:underline"
            >
              {viewReceiptLabel}
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">{noReceiptLabel}</span>
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
    </tr>
  );
}
