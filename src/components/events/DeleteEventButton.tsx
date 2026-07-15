"use client";

import { deleteEvent } from "@/actions/events";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import Swal from "@/lib/ui/swal-client";
import { confirmWithPasswordAction } from "@/lib/ui/confirm";
import { passwordErrorMessage } from "@/lib/auth/password-error-message";

interface DeleteEventButtonProps {
  eventId: string;
}

export function DeleteEventButton({ eventId }: DeleteEventButtonProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    const password = await confirmWithPasswordAction({
      title: t("common.deleteEventTitle"),
      text: t("common.deleteEventWarning"),
      confirmText: t("common.deleteEventConfirm"),
      cancelText: t("common.cancel"),
      tone: "danger",
      passwordPlaceholder: t("common.deleteEventPasswordPlaceholder"),
      passwordRequiredMessage: t("common.deleteEventPasswordRequired"),
    });

    if (!password) return;

    startTransition(async () => {
      try {
        await deleteEvent(eventId, password);
        toast.success(t("common.eventDeleted"));
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : t("common.failedToDeleteEvent");
        await Swal.fire({
          title: t("common.deleteEventSecurityErrorTitle"),
          text: passwordErrorMessage(t, message, "delete"),
          icon: "error",
          confirmButtonText: t("common.deleteEventUnderstood"),
          buttonsStyling: false,
          customClass: {
            popup: "fe-swal-popup fe-swal-popup--danger",
            title: "fe-swal-title",
            htmlContainer: "fe-swal-text",
            actions: "fe-swal-actions",
            confirmButton: "fe-swal-confirm fe-swal-confirm--danger",
          },
        });
      }
    });
  };

  return (
    <button
      type="button"
      onClick={() => void handleDelete()}
      disabled={isPending}
      data-testid="delete-event-with-password"
      className="text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400"
    >
      {isPending ? t("common.deleting") : t("common.delete")}
    </button>
  );
}
