"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approveSubscriptionPayment, rejectSubscriptionPayment } from "@/actions/billing";
import { formatCurrency } from "@/lib/utils";
import { Check, X, ExternalLink } from "lucide-react";

interface PendingRow {
  payment: {
    id: string;
    userId: string;
    amount: string;
    currency: string;
    method: string;
    reference: string | null;
    receiptUrl: string | null;
    createdAt: Date;
  };
  plan: { name: string; slug: string };
  userName?: string | null;
  userEmail?: string | null;
}

interface AdminSubscriptionPaymentsPanelProps {
  pending: PendingRow[];
}

export function AdminSubscriptionPaymentsPanel({ pending }: AdminSubscriptionPaymentsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const act = (paymentId: string, action: "approve" | "reject") => {
    startTransition(async () => {
      try {
        if (action === "approve") {
          await approveSubscriptionPayment(paymentId);
          toast.success("Plan activado para el organizador");
        } else {
          await rejectSubscriptionPayment(paymentId, "Comprobante rechazado");
          toast.success("Pago rechazado");
        }
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 border-b border-border/50 pb-3 text-lg font-semibold text-foreground">
        Pagos de suscripción pendientes
        {pending.length > 0 && (
          <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
            {pending.length}
          </span>
        )}
      </h2>

      {pending.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay pagos de planes pendientes de revisión.</p>
      ) : (
        <div className="space-y-3">
          {pending.map(({ payment, plan, userName, userEmail }) => (
            <div
              key={payment.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-foreground">
                  {userName ?? "Organizador"} → Plan {plan.name}
                </p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
                <p className="mt-1 text-sm">
                  {formatCurrency(Number(payment.amount), payment.currency, "es")} ·{" "}
                  <span className="uppercase">{payment.method}</span>
                  {payment.reference && ` · Ref: ${payment.reference}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(payment.createdAt).toLocaleString("es-PE")}
                </p>
                {payment.receiptUrl && (
                  <a
                    href={payment.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Ver comprobante
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => act(payment.id, "approve")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  Aprobar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => act(payment.id, "reject")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/40 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
