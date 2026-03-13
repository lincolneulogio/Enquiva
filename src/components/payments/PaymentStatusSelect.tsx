"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePaymentStatus } from "@/actions/payments";
import { toast } from "sonner";
import { paymentStatusValues } from "@/lib/validations";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { getPaymentStatusLabel } from "@/lib/i18n/core";
import { confirmDeleteAction } from "@/lib/ui/confirm";

interface PaymentStatusSelectProps {
  paymentId: string;
  currentStatus: typeof paymentStatusValues[number];
}

export function PaymentStatusSelect({ paymentId, currentStatus }: PaymentStatusSelectProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations();
  const { locale } = useLocale();

  const handleChange = async (value: string) => {
    const nextStatus = value as typeof paymentStatusValues[number];
    const statusLabel = getPaymentStatusLabel(nextStatus, locale);

    const isSpanish = locale.startsWith("es");
    const tone = nextStatus === "approved" ? "success" : nextStatus === "rejected" ? "danger" : "info";

    const confirmed = await confirmDeleteAction({
      title: isSpanish ? "Actualizar estado de pago" : "Update payment status",
      text: isSpanish
        ? `¿Deseas cambiar el estado del pago a \"${statusLabel}\"?`
        : `Do you want to change the payment status to "${statusLabel}"?`,
      confirmText: isSpanish ? "Sí, actualizar" : "Yes, update",
      cancelText: isSpanish ? "Cancelar" : "Cancel",
      tone,
    });

    if (!confirmed) {
      router.refresh();
      return;
    }

    startTransition(async () => {
      try {
        await updatePaymentStatus({ paymentId, status: nextStatus });
        toast.success(t("dashboard.admin.updatePaymentStatus"));
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("dashboard.admin.unableToUpdateStatus"));
      }
    });
  };

  return (
    <select
      value={currentStatus}
      onChange={(event) => {
        void handleChange(event.target.value);
      }}
      disabled={isPending}
      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
    >
      {paymentStatusValues.map((value) => (
        <option key={value} value={value}>
          {getPaymentStatusLabel(value, locale)}
        </option>
      ))}
    </select>
  );
}
