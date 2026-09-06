"use client";

import { type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";
import { cancelRegistration } from "@/actions/registrations";
import { confirmDeleteAction } from "@/lib/ui/confirm";
import Swal from "@/lib/ui/swal-client";

interface UseRegistrationCancelProps {
  registrationId?: string;
  setOptimisticStatus: (status: "registered" | "waitlisted" | "checked_in" | "cancelled" | null) => void;
  setCurrentHoldExpiresAt: (val: string | null) => void;
  startTransition: (cb: () => Promise<void>) => void;
  router: AppRouterInstance;
  t: (key: string, params?: Record<string, any>) => string;
}

export function useRegistrationCancel({
  registrationId,
  setOptimisticStatus,
  setCurrentHoldExpiresAt,
  startTransition,
  router,
  t,
}: UseRegistrationCancelProps) {
  const handleCancelClick = async () => {
    // 1. Confirm cancellation with the user first
    const confirmed = await confirmDeleteAction({
      title: t("register.cancelRegistrationTitle"),
      text: t("register.cancelRegistrationText"),
      confirmText: t("register.cancelConfirmContinue"),
      cancelText: t("register.cancelKeepActive"),
      tone: "danger",
    });

    if (!confirmed) return;

    // 2. Request user's password for security verification using a custom premium SweetAlert2 dialog
    const { value: password, isConfirmed } = await Swal.fire({
      title: t("register.securityVerificationTitle"),
      text: t("register.securityVerificationText"),
      input: "password",
      inputPlaceholder: t("register.passwordPlaceholder"),
      inputAttributes: {
        autocapitalize: "off",
        autocorrect: "off",
        required: "true",
      },
      showCancelButton: true,
      confirmButtonText: t("register.confirmCancellation"),
      cancelButtonText: t("common.cancel"),
      reverseButtons: true,
      buttonsStyling: false,
      focusCancel: true,
      customClass: {
        popup: "fe-swal-popup fe-swal-popup--danger",
        title: "fe-swal-title",
        htmlContainer: "fe-swal-text",
        input:
          "w-full mt-4 px-3.5 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-card text-foreground transition-all placeholder:text-muted-foreground",
        actions: "fe-swal-actions mt-6",
        confirmButton: "fe-swal-confirm fe-swal-confirm--danger",
        cancelButton: "fe-swal-cancel",
      },
      inputValidator: (value) => {
        if (!value) {
          return t("register.passwordRequiredContinue");
        }
      },
    });

    if (!isConfirmed || !password) return;

    // 3. Process cancellation in transition with the server action
    startTransition(async () => {
      setOptimisticStatus("cancelled");
      setCurrentHoldExpiresAt(null);
      try {
        const result = await cancelRegistration(registrationId!, password);
        if (result.success) {
          toast.success(t("register.registrationCancelled"));
          router.refresh();
        } else {
          throw new Error(t("register.wrongPassword"));
        }
      } catch (error) {
        setOptimisticStatus("registered");
        const errorMessage =
          error instanceof Error ? error.message : t("register.registrationCancelFailed");

        await Swal.fire({
          title: t("register.securityErrorTitle"),
          text:
            errorMessage.includes("Contraseña") ||
            errorMessage.includes("incorrecta") ||
            errorMessage.toLowerCase().includes("password")
              ? t("register.wrongPasswordKeepActive")
              : t("register.cancelFailedRetry"),
          icon: "error",
          confirmButtonText: t("register.understood"),
          buttonsStyling: false,
          customClass: {
            popup: "fe-swal-popup fe-swal-popup--danger",
            title: "fe-swal-title",
            htmlContainer: "fe-swal-text",
            actions: "fe-swal-actions mt-4",
            confirmButton: "fe-swal-confirm fe-swal-confirm--danger",
          },
        });
      }
    });
  };

  return { handleCancelClick };
}
