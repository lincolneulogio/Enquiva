import { Clock } from "lucide-react";

interface PendingPaymentsBannerProps {
  pendingCount: number;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function PendingPaymentsBanner({ pendingCount, t }: PendingPaymentsBannerProps) {
  if (pendingCount <= 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
      <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div>
        <p className="font-medium text-foreground">
          {t("payments.organizer.pendingBanner", { count: pendingCount })}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("payments.organizer.pendingHelp")}
        </p>
      </div>
    </div>
  );
}
