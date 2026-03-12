"use client";

import { deleteEvent } from "@/actions/events";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

interface DeleteEventButtonProps {
  eventId: string;
}

export function DeleteEventButton({ eventId }: DeleteEventButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmed = window.confirm("Are you sure you want to delete this event?");
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await deleteEvent(eventId);
        toast.success("Event deleted");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete event");
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
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
