import { type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";
import {
  getAttendeeDestination,
  paymentCheckoutPath,
} from "@/lib/navigation/attendee-paths";

export interface RegistrationResultLike {
  success?: boolean;
  status?: string;
  requiresPayment?: boolean;
  holdMinutes?: number | null;
  holdExpiresAt?: string | null;
  registrationId?: string | null;
}

interface HandleRegistrationSuccessOptions {
  result: RegistrationResultLike;
  role?: string | null;
  eventSlug?: string;
  effectiveWantsTransport?: boolean;
  router: AppRouterInstance;
  t: (key: string, params?: Record<string, any>) => string;
}

export function toastRegistrationSuccess(
  result: RegistrationResultLike,
  t: (key: string, params?: Record<string, any>) => string,
  opts?: { withTransport?: boolean },
) {
  if (result.status === "waitlisted") {
    toast.success(t("register.addedToWaitlist"));
    return;
  }
  if (result.requiresPayment && result.holdMinutes) {
    toast.success(
      t("register.registrationHoldSuccess", { minutes: result.holdMinutes }),
    );
    return;
  }
  toast.success(
    opts?.withTransport
      ? t("register.registrationWithTransportSuccess")
      : t("register.registrationSuccess"),
  );
}

export function routeAfterRegistration({
  result,
  role,
  eventSlug,
  effectiveWantsTransport,
  router,
}: HandleRegistrationSuccessOptions) {
  if (result.status === "waitlisted") {
    router.refresh();
  } else if (result.requiresPayment && result.registrationId) {
    router.push(paymentCheckoutPath(result.registrationId));
  } else {
    router.push(
      getAttendeeDestination(role, effectiveWantsTransport ? "transport" : "tickets", {
        eventSlug,
      }),
    );
  }
}
