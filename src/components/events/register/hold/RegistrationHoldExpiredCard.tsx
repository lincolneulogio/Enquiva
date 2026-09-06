"use client";

import React from "react";
import { AlertTriangle, Sparkles, Loader2 } from "lucide-react";

interface RegistrationHoldExpiredCardProps {
  isRegistrationClosed?: boolean;
  closedReason?: string | null;
  waitlistAvailable?: boolean;
  isPending: boolean;
  onRegisterAgain: () => void;
  renderModal: () => React.ReactNode;
  t: (key: string, params?: Record<string, any>) => string;
}

export function RegistrationHoldExpiredCard({
  isRegistrationClosed,
  closedReason,
  waitlistAvailable,
  isPending,
  onRegisterAgain,
  renderModal,
  t,
}: RegistrationHoldExpiredCardProps) {
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
