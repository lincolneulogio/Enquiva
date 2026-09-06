"use client";

import React from "react";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import { RegistrationHoldActiveCard } from "./RegistrationHoldActiveCard";
import { RegistrationHoldExpiredCard } from "./RegistrationHoldExpiredCard";

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
        <RegistrationHoldExpiredCard
          isRegistrationClosed={isRegistrationClosed}
          closedReason={closedReason}
          waitlistAvailable={waitlistAvailable}
          isPending={isPending}
          onRegisterAgain={onRegisterAgain}
          renderModal={renderModal}
          t={t}
        />
      );
    }

    // 3. Si requiere pago o tiene reserva temporal (hold) y el hold SIGUE ACTIVO (secondsRemaining > 0)
    if (currentHoldExpiresAt && secondsRemaining !== null && secondsRemaining > 0) {
      return (
        <RegistrationHoldActiveCard
          secondsRemaining={secondsRemaining}
          registrationId={registrationId}
          isPending={isPending}
          onCancelClick={onCancelClick}
          t={t}
        />
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
