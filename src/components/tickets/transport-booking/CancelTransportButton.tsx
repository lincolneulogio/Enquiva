"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelTransportBooking } from "@/actions/transport";
import { useTranslations } from "@/components/providers/LocaleProvider";
import Swal from "@/lib/ui/swal-client";
import { confirmDeleteAction } from "@/lib/ui/confirm";
import type { CancelTransportButtonProps } from "./types";

export function CancelTransportButton({ bookingId }: CancelTransportButtonProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleCancelClick = async () => {
    // 1. Confirm cancellation with the user first
    const confirmed = await confirmDeleteAction({
      title: "¿Cancelar tu reserva?",
      text: "¿Estás seguro de que deseas cancelar tu reserva de transporte? Esta acción liberará tu asiento reservado y cancelará cualquier pago pendiente asociado.",
      confirmText: "Sí, continuar",
      cancelText: "No, mantener activa",
      tone: "danger",
    });

    if (!confirmed) return;

    // 2. Request user's password for security verification using SweetAlert2 dialog
    const { value: password, isConfirmed } = await Swal.fire({
      title: "Verificación de Seguridad",
      text: "Ingresa tu contraseña para confirmar la cancelación de tu reserva:",
      input: "password",
      inputPlaceholder: "Contraseña",
      inputAttributes: {
        autocapitalize: "off",
        autocorrect: "off",
        required: "true",
      },
      showCancelButton: true,
      confirmButtonText: "Confirmar Cancelación",
      cancelButtonText: "Cancelar",
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
          return "¡Debes ingresar tu contraseña para continuar!";
        }
      },
    });

    if (!isConfirmed || !password) return;

    // 3. Process cancellation in transition with the server action
    startTransition(async () => {
      try {
        const result = await cancelTransportBooking(bookingId, password);
        if (result.success) {
          toast.success(t("transport.booking.canceledSuccess") || "Reserva cancelada con éxito");
          router.refresh();
        } else {
          throw new Error("Contraseña incorrecta.");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "No se pudo procesar la cancelación.";

        await Swal.fire({
          title: "Error de Seguridad",
          text:
            errorMessage.includes("Contraseña") || errorMessage.includes("incorrecta")
              ? "La contraseña ingresada es incorrecta. Tu reserva permanece activa."
              : "No se pudo procesar la cancelación. Inténtalo de nuevo.",
          icon: "error",
          confirmButtonText: "Entendido",
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

  return (
    <button
      type="button"
      onClick={handleCancelClick}
      disabled={isPending}
      className="text-xs text-destructive hover:underline disabled:opacity-50"
    >
      {isPending ? t("transport.booking.cancelling") : t("transport.booking.cancelBooking")}
    </button>
  );
}
