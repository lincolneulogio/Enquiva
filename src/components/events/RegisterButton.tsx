"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerForEvent, cancelRegistration } from "@/actions/registrations";
import { Loader2, CheckCircle, Clock } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { normalizePeruPhone } from "@/lib/utils";

interface RegisterButtonProps {
  eventId: string;
  isAuthenticated: boolean;
  isRegistrationClosed?: boolean;
  closedReason?: string | null;
  userPhone?: string | null;
  hasTransport?: boolean;
  currentStatus?: "registered" | "waitlisted" | "checked_in" | "cancelled" | null;
  registrationId?: string;
}

export function RegisterButton({
  eventId,
  isAuthenticated,
  isRegistrationClosed = false,
  closedReason,
  userPhone,
  hasTransport = false,
  currentStatus,
  registrationId,
}: RegisterButtonProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState(currentStatus);
  const [contactPhone, setContactPhone] = useState(
    userPhone?.replace(/^\+51/, "") ?? ""
  );

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

  return (
    <div className="space-y-3">
      {!isAuthenticated && (
        <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <p>
            {t("register.haveAccountPrompt")}{" "}
            <a href="/login?callbackUrl=/events" className="font-medium text-primary hover:underline">
              {t("register.signInOptional")}
            </a>
          </p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-3 text-left">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("register.confirmContactPhone")}
        </label>
        <div className="flex overflow-hidden rounded-lg border border-border bg-background focus-within:border-primary">
          <span className="flex items-center border-r border-border bg-muted/60 px-3 text-sm font-medium text-muted-foreground">
            +51
          </span>
          <input
            inputMode="numeric"
            maxLength={9}
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value.replace(/\D/g, "").slice(0, 9))}
            placeholder="912345678"
            className="w-full px-3 py-2 text-sm focus:outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("register.peruPhoneFormat")}
        </p>
      </div>

      <button
        onClick={() => {
          const normalizedPhone = normalizePeruPhone(contactPhone);
          if (!/^\+519\d{8}$/.test(normalizedPhone)) {
            toast.error(t("register.invalidPhoneFormat"));
            return;
          }

          startTransition(async () => {
            try {
              const result = await registerForEvent({
                eventId,
                contactPhone: normalizedPhone,
              });
              if (result.success) {
                setOptimisticStatus("registered");
                toast.success(t("register.registrationSuccess"));

                if (!isAuthenticated) {
                  if (result.ticketCode) {
                    router.push(`/ticket/${result.ticketCode}?from=phone-signup`);
                    return;
                  }

                  router.refresh();
                  return;
                }

                router.push(hasTransport ? "/member/transport" : "/member/tickets");
                return;
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
