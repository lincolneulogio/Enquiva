"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/LocaleProvider";
import { getPaymentStatusLabel } from "@/lib/i18n/core";

interface PaymentStatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const { locale } = useLocale();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        STATUS_STYLES[status] ?? STATUS_STYLES.pending,
        className
      )}
    >
      {getPaymentStatusLabel(status, locale)}
    </span>
  );
}
