"use client";

import Link from "next/link";
import { Clock, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { paymentCheckoutPath } from "@/lib/navigation/attendee-paths";

interface RegistrationHoldActiveCardProps {
  secondsRemaining: number;
  registrationId?: string;
  isPending: boolean;
  onCancelClick: () => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export function RegistrationHoldActiveCard({
  secondsRemaining,
  registrationId,
  isPending,
  onCancelClick,
  t,
}: RegistrationHoldActiveCardProps) {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isUrgent = secondsRemaining < 300;

  return (
    <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
          <Clock className="h-4 w-4 animate-pulse text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="truncate">
            {t("register.holdPendingTitle") || "Cupo reservado · Pago pendiente"}
          </span>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold tracking-tight shadow-xs shrink-0",
            isUrgent
              ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 animate-pulse"
              : "bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30",
          )}
        >
          <span className="text-[11px] opacity-80">⏱️</span>
          <span>{formattedTime}</span>
        </div>
      </div>

      <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
        {t("register.holdNotice") ||
          "Completa tu pago antes de que expire el tiempo o tu cupo se liberará automáticamente."}
      </p>

      {registrationId && (
        <Link
          href={paymentCheckoutPath(registrationId)}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 text-sm font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-98 transition-all cursor-pointer"
        >
          <CreditCard className="h-4 w-4" />
          <span>{t("register.completePayment") || "Completar pago ahora"}</span>
          <ArrowRight className="h-4 w-4 ml-auto opacity-80" />
        </Link>
      )}

      {registrationId && (
        <button
          type="button"
          onClick={onCancelClick}
          disabled={isPending}
          className="block w-full text-center text-xs text-muted-foreground hover:text-destructive transition-colors py-1 cursor-pointer disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="mx-auto h-3 w-3 animate-spin" />
          ) : (
            t("register.cancelHold") || t("register.cancelRegistration")
          )}
        </button>
      )}
    </div>
  );
}
