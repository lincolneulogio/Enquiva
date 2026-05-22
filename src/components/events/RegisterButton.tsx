"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerForEvent, cancelRegistration } from "@/actions/registrations";
import { Loader2, CheckCircle, Clock } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import Link from "next/link";

interface RegisterButtonProps {
  eventId: string;
  isAuthenticated: boolean;
  isRegistrationClosed?: boolean;
  closedReason?: string | null;
  hasTransport?: boolean;
  currentStatus?: "registered" | "waitlisted" | "checked_in" | "cancelled" | null;
  registrationId?: string;
}

export function RegisterButton({
  eventId,
  isAuthenticated,
  isRegistrationClosed = false,
  closedReason,
  hasTransport = false,
  currentStatus,
  registrationId,
}: RegisterButtonProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState(currentStatus);

  const mapRegistrationError = (message: string) => {
    const normalized = message.toLowerCase();

    if (normalized.includes("registration_closed_event_full") || normalized.includes("full")) {
      return t("register.eventFull");
    }

    if (
      normalized.includes("registration_closed_event_expired") ||
      normalized.includes("expired") ||
      normalized.includes("already passed")
    ) {
      return t("register.eventExpired");
    }

    if (normalized.includes("registration_unavailable") || normalized.includes("not found")) {
      return t("register.registrationUnavailable");
    }

    if (normalized.includes("already registered")) {
      return t("register.youreRegistered");
    }

    return message;
  };

  if (optimisticStatus === "registered" || optimisticStatus === "checked_in") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          {optimisticStatus === "checked_in" ? t("register.checkedIn") : t("register.youreRegistered")}
        </div>
        {optimisticStatus === "registered" && registrationId && (
          <button
            onClick={() => {
              startTransition(async () => {
                setOptimisticStatus("cancelled");
                try {
                  await cancelRegistration(registrationId);
                  toast.success(t("register.registrationCancelled"));
                  router.refresh();
                } catch {
                  setOptimisticStatus("registered");
                  toast.error(t("register.registrationCancelFailed"));
                }
              });
            }}
            disabled={isPending}
            className="block w-full rounded-xl border border-border py-2 text-center text-xs text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
          >
            {isPending ? <Loader2 className="mx-auto h-3 w-3 animate-spin" /> : t("register.cancelRegistration")}
          </button>
        )}
      </div>
    );
  }

  if (optimisticStatus === "waitlisted") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 py-3 text-sm font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
        <Clock className="h-4 w-4" />
        {t("register.onWaitlist")}
      </div>
    );
  }

  if (isRegistrationClosed) {
    return (
      <div className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{t("register.registrationClosed")}</p>
        <p className="mt-1 text-xs">{closedReason ?? t("register.registrationUnavailable")}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-center">
        <p className="mb-3 text-sm text-muted-foreground">
          {t("register.signInToRegister")}
        </p>
        <Link
          href="/login?callbackUrl=/events"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t("register.signInOptional")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          startTransition(async () => {
            try {
              const result = await registerForEvent({
                eventId,
              });
              if (result.success) {
                setOptimisticStatus("registered");
                toast.success(t("register.registrationSuccess"));
                router.push(hasTransport ? "/member/transport" : "/member/tickets");
              }
            } catch (error) {
              setOptimisticStatus(null);
              toast.error(
                error instanceof Error
                  ? mapRegistrationError(error.message)
                  : t("register.registrationFailed")
              );
            }
          });
        }}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          t("register.registerNow")
        )}
      </button>
    </div>
  );
}
