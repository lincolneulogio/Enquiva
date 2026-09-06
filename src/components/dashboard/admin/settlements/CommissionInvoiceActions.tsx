"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Loader2, CheckCircle2 } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import {
  issueCommissionInvoice,
  markCommissionInvoicePaid,
} from "@/actions/billing/commission-invoices";

export function IssueCommissionInvoiceButton({ organizerId }: { organizerId: string }) {
  const t = useTranslations();
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
            toast.success(t("dashboard.admin.invoiceIssued"));
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : t("dashboard.admin.invoiceIssueError"));
          }
        });
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
      {t("dashboard.admin.invoiceButton")}
    </button>
  );
}

export function MarkCommissionInvoicePaidButton({ invoiceId }: { invoiceId: string }) {
  const t = useTranslations();
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
            toast.success(t("dashboard.admin.invoiceMarkedPaid"));
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : t("dashboard.admin.invoiceUpdateError"));
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
      {t("dashboard.admin.invoiceCollected")}
    </button>
  );
}
