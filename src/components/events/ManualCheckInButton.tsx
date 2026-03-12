"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { checkInAttendee } from "@/actions/registrations";

interface ManualCheckInButtonProps {
  registrationId: string;
  eventId: string;
}

export function ManualCheckInButton({ registrationId, eventId }: ManualCheckInButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onCheckIn = () => {
    startTransition(async () => {
      try {
        await checkInAttendee({ registrationId, eventId });
        toast.success("Asistencia registrada correctamente");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo registrar la asistencia");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={onCheckIn}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      {isPending ? "Checking in..." : "Check in now"}
    </button>
  );
}
