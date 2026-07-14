"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";
import { initiatePaymentRefund } from "@/actions/payments/refund";
import { confirmDeleteAction } from "@/lib/ui/confirm";
import { useLocale } from "@/components/providers/LocaleProvider";

export function PaymentRefundButton({
  paymentId,
  disabled,
}: {
  paymentId: string;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { locale } = useLocale();
  const isEs = locale.startsWith("es");

  const handleClick = async () => {
    const confirmed = await confirmDeleteAction({
      title: isEs ? "Reembolsar pago Culqi" : "Refund Culqi payment",
      text: isEs
        ? "Se solicitará el reembolso en Culqi y se cancelarán los tickets asociados cuando Culqi confirme."
        : "A Culqi refund will be requested and associated tickets will be cancelled once Culqi confirms.",
      confirmText: isEs ? "Sí, reembolsar" : "Yes, refund",
      cancelText: isEs ? "Cancelar" : "Cancel",
      tone: "danger",
    });
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await initiatePaymentRefund({ paymentId });
        toast.success(isEs ? "Reembolso iniciado" : "Refund initiated");
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : isEs
              ? "No se pudo iniciar el reembolso"
              : "Could not start refund",
        );
      }
    });
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={disabled || isPending}
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-500/10 disabled:opacity-50 dark:text-rose-300"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
      {isEs ? "Reembolsar" : "Refund"}
    </button>
  );
}
