"use client";

import { useState, useEffect } from "react";
import { type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";

interface UseHoldCountdownProps {
  initialHoldExpiresAt: string | Date | null;
  optimisticPaymentStatus: string | null;
  optimisticStatus: string | null;
  router: AppRouterInstance;
  t: (key: string, params?: Record<string, any>) => string;
}

export function useHoldCountdown({
  initialHoldExpiresAt,
  optimisticPaymentStatus,
  optimisticStatus,
  router,
  t,
}: UseHoldCountdownProps) {
  const [currentHoldExpiresAt, setCurrentHoldExpiresAt] = useState<string | null>(
    initialHoldExpiresAt
      ? initialHoldExpiresAt instanceof Date
        ? initialHoldExpiresAt.toISOString()
        : String(initialHoldExpiresAt)
      : null,
  );

  useEffect(() => {
    setCurrentHoldExpiresAt(
      initialHoldExpiresAt
        ? initialHoldExpiresAt instanceof Date
          ? initialHoldExpiresAt.toISOString()
          : String(initialHoldExpiresAt)
        : null,
    );
  }, [initialHoldExpiresAt]);

  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(() => {
    if (!currentHoldExpiresAt) return null;
    const diff = Math.floor((new Date(currentHoldExpiresAt).getTime() - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  });

  useEffect(() => {
    if (
      !currentHoldExpiresAt ||
      optimisticPaymentStatus === "approved" ||
      (optimisticStatus !== "registered" && optimisticStatus !== null)
    ) {
      setSecondsRemaining(null);
      return;
    }

    const calcRemaining = () => {
      const diff = Math.floor((new Date(currentHoldExpiresAt).getTime() - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    };

    const initial = calcRemaining();
    setSecondsRemaining(initial);

    if (initial <= 0) return;

    const interval = setInterval(() => {
      const remaining = calcRemaining();
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        toast.error(
          t("register.holdExpiredToast") ||
            "Tu reserva temporal ha expirado y el cupo fue liberado.",
        );
        router.refresh();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentHoldExpiresAt, optimisticPaymentStatus, optimisticStatus, router, t]);

  return {
    currentHoldExpiresAt,
    setCurrentHoldExpiresAt,
    secondsRemaining,
  };
}
