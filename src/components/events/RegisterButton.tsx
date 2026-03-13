"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerForEvent, cancelRegistration } from "@/actions/registrations";
import { Loader2, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/components/providers/LocaleProvider";

interface RegisterButtonProps {
  eventId: string;
  isAuthenticated: boolean;
  isFull: boolean;
  userPhone?: string | null;
  hasTransport?: boolean;
  currentStatus?: "registered" | "waitlisted" | "checked_in" | "cancelled" | null;
  registrationId?: string;
}

const PERU_PHONE_REGEX = /^\+519\d{8}$/;

export function RegisterButton({
  eventId,
  isAuthenticated,
  isFull,
  userPhone,
  hasTransport = false,
  currentStatus,
  registrationId,
}: RegisterButtonProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState(currentStatus);
  const [contactPhone, setContactPhone] = useState(userPhone ?? "");

  if (!isAuthenticated) {
    return (
      <a
        href={`/login?callbackUrl=/events`}
        className="block w-full rounded-xl bg-primary py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {t("register.signInToRegister")}
      </a>
    );
  }

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

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-3 text-left">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("register.confirmContactPhone")}
        </label>
        <input
          value={contactPhone}
          onChange={(event) => setContactPhone(event.target.value)}
          placeholder={t("register.contactPhonePlaceholder")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {t("register.peruPhoneFormat")}
        </p>
      </div>

      <button
        onClick={() => {
          const normalizedPhone = contactPhone.trim();
          if (!PERU_PHONE_REGEX.test(normalizedPhone)) {
            toast.error(t("register.invalidPhoneFormat"));
            return;
          }

          startTransition(async () => {
            // Optimistic update
            setOptimisticStatus(isFull ? "waitlisted" : "registered");
            try {
              const result = await registerForEvent({
                eventId,
                contactPhone: normalizedPhone,
              });
              if (result.success) {
                toast.success(
                  result.status === "waitlisted"
                    ? t("register.addedToWaitlist")
                    : t("register.registrationSuccess")
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
                error instanceof Error ? error.message : t("register.registrationFailed")
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
          t("register.joinWaitlist")
        ) : (
          t("register.registerNow")
        )}
      </button>
    </div>
  );
}
