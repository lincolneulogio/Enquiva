import Link from "next/link";
import { getAdminPayments } from "@/actions/payments";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { PaymentStatusSelect } from "@/components/payments/PaymentStatusSelect";
import { formatCurrency } from "@/lib/utils";
import { Calendar } from "lucide-react";

export default async function AdminPaymentsPage() {
  const payments = await getAdminPayments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">Payments</h1>
        <p className="mt-1 text-muted-foreground">
          Revisa y aprueba pagos de transporte en la plataforma.
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Showing {payments.length} payments</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Payment</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Event</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Route</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Attendee</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Method</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Update</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.map(({ payment, event, attendee, transportRoute }) => (
                <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="text-xs text-muted-foreground">#{payment.id.slice(0, 8)}</div>
                    <div className="text-foreground text-sm font-medium">
                      {new Date(payment.createdAt).toLocaleDateString("en-US", {
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
                    {transportRoute?.name ?? "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">
                    <div className="font-medium text-foreground">{attendee.name ?? "Guest"}</div>
                    <div>{attendee.email}</div>
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-semibold text-foreground">
                    {formatCurrency(Number(payment.amount), payment.currency)}
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
                        View receipt
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">No receipt</span>
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
