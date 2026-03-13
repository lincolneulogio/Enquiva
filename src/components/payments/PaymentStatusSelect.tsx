"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePaymentStatus } from "@/actions/payments";
import { toast } from "sonner";
import { paymentStatusValues } from "@/lib/validations";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { getPaymentStatusLabel } from "@/lib/i18n/core";

interface PaymentStatusSelectProps {
  paymentId: string;
  currentStatus: typeof paymentStatusValues[number];
}

export function PaymentStatusSelect({ paymentId, currentStatus }: PaymentStatusSelectProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const t = useTranslations();
  const { locale } = useLocale();

  const handleChange = (value: string) => {
    startTransition(async () => {
      try {
        await updatePaymentStatus({ paymentId, status: value as typeof paymentStatusValues[number] });
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
      onChange={(event) => handleChange(event.target.value)}
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
