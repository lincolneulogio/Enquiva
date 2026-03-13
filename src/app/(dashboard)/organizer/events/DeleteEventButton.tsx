"use client";

import { deleteEvent } from "@/actions/events";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

interface DeleteEventButtonProps {
  eventId: string;
}

export function DeleteEventButton({ eventId }: DeleteEventButtonProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmed = window.confirm(t("common.confirmDeleteEvent"));
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await deleteEvent(eventId);
        toast.success(t("common.eventDeleted"));
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("common.failedToDeleteEvent"));
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
