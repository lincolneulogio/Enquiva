"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle, AlertTriangle, Sparkles, Clock, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { paymentCheckoutPath } from "@/lib/navigation/attendee-paths";

interface RegistrationStatusBannerProps {
  optimisticStatus: "registered" | "waitlisted" | "checked_in" | "cancelled" | null;
  optimisticPaymentStatus: "pending" | "approved" | "rejected" | null;
  currentHoldExpiresAt: string | null;
  secondsRemaining: number | null;
  registrationId?: string;
  isRegistrationClosed?: boolean;
  closedReason?: string | null;
  waitlistAvailable?: boolean;
  isPending: boolean;
  onRegisterAgain: () => void;
  onCancelClick: () => void;
  renderModal: () => React.ReactNode;
  t: (key: string, params?: Record<string, any>) => string;
}

export function RegistrationStatusBanner({
  optimisticStatus,
  optimisticPaymentStatus,
  currentHoldExpiresAt,
  secondsRemaining,
  registrationId,
  isRegistrationClosed,
  closedReason,
  waitlistAvailable,
  isPending,
  onRegisterAgain,
  onCancelClick,
  renderModal,
  t,
}: RegistrationStatusBannerProps) {
  if (optimisticStatus === "registered" || optimisticStatus === "checked_in") {
    if (optimisticStatus === "checked_in") {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            {t("register.checkedIn")}
          </div>
        </div>
      );
    }

    // 1. Si el pago ya fue aprobado
    if (optimisticPaymentStatus === "approved") {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            {t("register.youreRegistered")}
          </div>
          {registrationId && (
            <div className="rounded-xl bg-muted/60 p-3 border border-border/80 text-center text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">{t("register.paidConfirmedTitle")}</span>
              <p className="mt-0.5 text-[11px]">{t("register.paidConfirmedHelp")}</p>
            </div>
          )}
        </div>
      );
    }

    // 2. Si requiere pago o tiene reserva temporal (hold) y el hold ya expiró (secondsRemaining === 0)
    if (currentHoldExpiresAt && secondsRemaining === 0) {
      return (
        <div className="space-y-3">
          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 dark:bg-destructive/10 p-4 text-center space-y-1.5 shadow-xs">
            <div className="flex items-center justify-center gap-2 text-destructive font-bold text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>{t("register.holdExpiredTitle") || "Tu reserva temporal expiró"}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("register.holdExpiredText") ||
                "El tiempo límite para pagar finalizó y tu cupo fue liberado. Puedes volver a inscribirte si aún hay cupos disponibles."}
            </p>
          </div>

          {isRegistrationClosed ? (
            <div className="rounded-xl bg-muted/60 p-3 border border-border text-center text-xs text-muted-foreground">
              {closedReason || t("register.errors.eventExpired")}
            </div>
          ) : (
            <button
              type="button"
              onClick={onRegisterAgain}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 px-6 text-sm font-bold shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {waitlistAvailable
                      ? t("register.joinWaitlist")
                      : t("register.reserveAgain") || t("register.registerAgain")}
                  </span>
                </>
              )}
            </button>
          )}
          {renderModal()}
        </div>
      );
    }

    // 3. Si requiere pago o tiene reserva temporal (hold) y el hold SIGUE ACTIVO (secondsRemaining > 0)
    if (currentHoldExpiresAt && secondsRemaining !== null && secondsRemaining > 0) {
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

    // 4. Si es evento gratuito (sin hold ni pago pendiente)
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          {t("register.youreRegistered")}
        </div>
        {registrationId && (
          <button
            type="button"
            onClick={onCancelClick}
            disabled={isPending}
            className="block w-full rounded-xl border border-border py-2 text-center text-xs text-muted-foreground hover:border-destructive hover:text-destructive transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="mx-auto h-3 w-3 animate-spin" />
            ) : (
              t("register.cancelRegistration")
            )}
          </button>
        )}
      </div>
    );
  }

  if (optimisticStatus === "cancelled") {
    return (
      <div className="space-y-2">
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-center text-sm text-muted-foreground">
          {t("register.cancelledCanRejoin")}
        </div>
        <button
          type="button"
          onClick={onRegisterAgain}
          disabled={isPending}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("register.registerAgain")}
        </button>
        {renderModal()}
      </div>
    );
  }

  if (optimisticStatus === "waitlisted") {
    return (
      <div className="space-y-2 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
        <div className="flex items-center justify-center gap-2 font-medium">
          <Clock className="h-4 w-4" />
          {t("register.onWaitlist")}
        </div>
        <p className="text-center text-xs text-amber-700/90 dark:text-amber-300/90">
          {t("register.waitlistNoExtras")}
        </p>
      </div>
    );
  }

  return null;
}
