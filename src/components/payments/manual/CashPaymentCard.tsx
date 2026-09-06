import { PaymentBrandMark } from "@/components/payments/PaymentBrandMark";
import { useTranslations } from "@/components/providers/LocaleProvider";

interface CashPaymentCardProps {
  defaultAmount: number;
}

export function CashPaymentCard({ defaultAmount }: CashPaymentCardProps) {
  const t = useTranslations();

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50 dark:bg-purple-950/10 dark:border-purple-900/30 p-4 text-sm space-y-2">
      <div className="flex items-center gap-2">
        <PaymentBrandMark brand="cash" size="sm" />
        <p className="font-medium text-purple-800 dark:text-purple-300">{t("payments.manual.cashTitle")}</p>
      </div>
      <p className="text-purple-600 dark:text-purple-400">{t("payments.manual.cashDescription")}</p>
      <p className="text-xs text-purple-700/80 dark:text-purple-400/90">{t("payments.manual.cashNoTicketYet")}</p>
      <p className="text-purple-600 dark:text-purple-400">
        {t("payments.manual.amountPen")}: <strong>S/ {defaultAmount.toFixed(2)}</strong>
      </p>
    </div>
  );
}
