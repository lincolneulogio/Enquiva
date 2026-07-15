"use client";

import { deleteEvent } from "@/actions/events";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { confirmDeleteAction } from "@/lib/ui/confirm";

interface DeleteEventButtonProps {
  eventId: string;
}

export function DeleteEventButton({ eventId }: DeleteEventButtonProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    const confirmed = await confirmDeleteAction({
      title: t("common.deleteEventTitle"),
      text: t("common.deleteEventWarning"),
      confirmText: t("common.deleteEventContinue"),
      cancelText: t("common.cancel"),
      tone: "danger",
    });
    if (!confirmed) return;

    const { value: password, isConfirmed } = await Swal.fire({
      title: t("common.deleteEventPasswordTitle"),
      text: t("common.deleteEventPasswordText"),
      input: "password",
      inputPlaceholder: t("common.deleteEventPasswordPlaceholder"),
      inputAttributes: {
        autocapitalize: "off",
        autocorrect: "off",
        required: "true",
      },
      showCancelButton: true,
      confirmButtonText: t("common.deleteEventConfirm"),
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
          return t("common.deleteEventPasswordRequired");
        }
      },
    });

    if (!isConfirmed || !password) return;

    startTransition(async () => {
      try {
        await deleteEvent(eventId, password);
        toast.success(t("common.eventDeleted"));
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : t("common.failedToDeleteEvent");
        const isPasswordError =
          message === "PASSWORD_INVALID" ||
          message === "PASSWORD_REQUIRED" ||
          message.toLowerCase().includes("password") ||
          message.toLowerCase().includes("contraseña");

        await Swal.fire({
          title: t("common.deleteEventSecurityErrorTitle"),
          text: isPasswordError ? t("common.deleteEventWrongPassword") : message,
          icon: "error",
          confirmButtonText: t("common.deleteEventUnderstood"),
          buttonsStyling: false,
          customClass: {
            popup: "fe-swal-popup fe-swal-popup--danger",
            title: "fe-swal-title",
            htmlContainer: "fe-swal-text",
            confirmButton: "fe-swal-confirm fe-swal-confirm--danger",
          },
        });
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400"
    >
      {isPending ? t("common.deleting") : t("common.delete")}
    </button>
  );
}
