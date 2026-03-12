import { getOrganizerPayments } from "@/actions/payments";
import { formatCurrency } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import Link from "next/link";

export default async function OrganizerPaymentsPage() {
  const payments = await getOrganizerPayments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">Payments</h1>
        <p className="mt-1 text-muted-foreground">
          Seguimiento de pagos de transporte para tus eventos.
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-lg font-semibold text-foreground">No payments yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuando los asistentes reserven transporte aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Event</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Route</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Attendee</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map(({ payment, event, attendee, transportRoute }) => (
                <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4">
                    <Link href={`/events/${event.slug}`} className="font-medium text-foreground hover:text-primary">
                      {event.title}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    {transportRoute?.name ?? "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    <div className="font-medium text-foreground">{attendee.name ?? "Guest"}</div>
                    <div>{attendee.email}</div>
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-foreground">
                    {formatCurrency(Number(payment.amount), payment.currency)}
                  </td>
                  <td className="px-4 py-4">
                    <PaymentStatusBadge status={payment.status} />
                  </td>
                  <td className="px-4 py-4">
                    {payment.receiptUrl ? (
                      <a href={payment.receiptUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary hover:underline">
                        View receipt
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Awaiting receipt</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
