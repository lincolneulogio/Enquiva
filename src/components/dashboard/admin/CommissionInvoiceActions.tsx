"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Loader2, CheckCircle2 } from "lucide-react";
import {
  issueCommissionInvoice,
  markCommissionInvoicePaid,
} from "@/actions/billing/commission-invoices";

export function IssueCommissionInvoiceButton({ organizerId }: { organizerId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            await issueCommissionInvoice({ organizerId, sendEmail: true });
            toast.success("Factura emitida y enviada al organizador");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudo emitir la factura");
          }
        });
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-800 hover:bg-orange-500/20 disabled:opacity-50 dark:text-orange-200"
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
      Facturar
    </button>
  );
}

export function MarkCommissionInvoicePaidButton({ invoiceId }: { invoiceId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            await markCommissionInvoicePaid(invoiceId);
            toast.success("Factura marcada como pagada (cash / Culqi)");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudo actualizar");
          }
        });
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-200"
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <CheckCircle2 className="h-3 w-3" />
      )}
      Cobrado
    </button>
  );
}
