"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerForEvent, cancelRegistration } from "@/actions/registrations";
import { Loader2, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface RegisterButtonProps {
  eventId: string;
  isAuthenticated: boolean;
  isFull: boolean;
  hasTransport?: boolean;
  currentStatus?: "registered" | "waitlisted" | "checked_in" | "cancelled" | null;
  registrationId?: string;
}

export function RegisterButton({
  eventId,
  isAuthenticated,
  isFull,
  hasTransport = false,
  currentStatus,
  registrationId,
}: RegisterButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState(currentStatus);

  if (!isAuthenticated) {
    return (
      <a
        href={`/login?callbackUrl=/events`}
        className="block w-full rounded-xl bg-primary py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Sign In to Register
      </a>
    );
  }

  if (optimisticStatus === "registered" || optimisticStatus === "checked_in") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          {optimisticStatus === "checked_in" ? "Checked In" : "You're Registered!"}
        </div>
        {optimisticStatus === "registered" && registrationId && (
          <button
            onClick={() => {
              startTransition(async () => {
                setOptimisticStatus("cancelled");
                try {
                  await cancelRegistration(registrationId);
                  toast.success("Registration cancelled");
                  router.refresh();
                } catch {
                  setOptimisticStatus("registered");
                  toast.error("Failed to cancel registration");
                }
              });
            }}
            disabled={isPending}
            className="block w-full rounded-xl border border-border py-2 text-center text-xs text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
          >
            {isPending ? <Loader2 className="mx-auto h-3 w-3 animate-spin" /> : "Cancel Registration"}
          </button>
        )}
      </div>
    );
  }

  if (optimisticStatus === "waitlisted") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 py-3 text-sm font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
        <Clock className="h-4 w-4" />
        On Waitlist
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        startTransition(async () => {
          // Optimistic update
          setOptimisticStatus(isFull ? "waitlisted" : "registered");
          try {
            const result = await registerForEvent(eventId);
            if (result.success) {
              toast.success(
                result.status === "waitlisted"
                  ? "Added to waitlist!"
                  : "Successfully registered! 🎉"
              );
              if (result.status === "registered") {
                router.push(hasTransport ? "/member/transport" : "/member/tickets");
                return;
              }
              router.refresh();
            }
          } catch (error) {
            setOptimisticStatus(null);
            toast.error(
              error instanceof Error ? error.message : "Registration failed"
            );
          }
        });
      }}
      disabled={isPending}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-colors",
        isFull
          ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          : "bg-primary text-primary-foreground hover:bg-primary/90"
      )}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFull ? (
        "Join Waitlist"
      ) : (
        "Register Now"
      )}
    </button>
  );
}
