"use client";

import { type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";
import { registerForEvent } from "@/actions/registrations";
import { translateRegistrationError } from "@/lib/errors/registration";
import {
  getAttendeeDestination,
  paymentCheckoutPath,
} from "@/lib/navigation/attendee-paths";

interface UseRegistrationSubmitProps {
  eventId: string;
  eventSlug?: string;
  effectiveScheduleId: string;
  hasMultipleSchedules: boolean;
  effectiveWantsTransport: boolean;
  contactPhone: string;
  selectedRouteId: string;
  selectedStopId: string;
  seatsCount: number;
  effectiveWantsCertificate: boolean;
  guests: Array<{ name: string; phone: string }>;
  role?: string | null;
  startTransition: (cb: () => Promise<void>) => void;
  setOptimisticStatus: (status: any) => void;
  setCurrentHoldExpiresAt: (val: string | null) => void;
  setOptimisticPaymentStatus: (status: any) => void;
  setIsModalOpen: (open: boolean) => void;
  clearRegistrationDraft: () => void;
  router: AppRouterInstance;
  t: (key: string, params?: Record<string, any>) => string;
}

export function useRegistrationSubmit({
  eventId,
  eventSlug,
  effectiveScheduleId,
  hasMultipleSchedules,
  effectiveWantsTransport,
  contactPhone,
  selectedRouteId,
  selectedStopId,
  seatsCount,
  effectiveWantsCertificate,
  guests,
  role,
  startTransition,
  setOptimisticStatus,
  setCurrentHoldExpiresAt,
  setOptimisticPaymentStatus,
  setIsModalOpen,
  clearRegistrationDraft,
  router,
  t,
}: UseRegistrationSubmitProps) {
  const mapRegistrationError = (message: string) =>
    translateRegistrationError(t, message);

  const toastRegistrationSuccess = (
    result: {
      status?: string;
      requiresPayment?: boolean;
      holdMinutes?: number | null;
    },
    opts?: { withTransport?: boolean },
  ) => {
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
  };

  const validateInputs = () => {
    if (hasMultipleSchedules && !effectiveScheduleId) {
      toast.error(t("register.selectedScheduleRequired"));
      return false;
    }

    if (effectiveWantsTransport) {
      if (contactPhone.trim() === "") {
        toast.error(t("register.phoneRequiredForTransport"));
        return false;
      }
      const cleanPhone = contactPhone.replace(/\D/g, "");
      if (cleanPhone.length !== 9 || !cleanPhone.startsWith("9")) {
        toast.error(t("register.phoneMustBePeruMobile"));
        return false;
      }

      for (let i = 0; i < guests.length; i++) {
        const guest = guests[i];
        if (guest.phone) {
          const cleanGuestPhone = guest.phone.replace(/\D/g, "");
          if (cleanGuestPhone.length !== 9 || !cleanGuestPhone.startsWith("9")) {
            toast.error(
              t("register.guestPhoneInvalid", { index: i + 1, name: guest.name }),
            );
            return false;
          }
        }
      }
    }

    for (let i = 0; i < guests.length; i++) {
      if (guests[i].name.trim().length < 2) {
        toast.error(t("register.guestNameInvalid", { index: i + 1 }));
        return false;
      }
    }

    return true;
  };

  const handleRegisterSubmit = () => {
    if (!validateInputs()) return;

    startTransition(async () => {
      try {
        const payload = {
          eventId,
          scheduleId: effectiveScheduleId || null,
          contactPhone:
            effectiveWantsTransport && contactPhone
              ? `+51${contactPhone.replace(/\D/g, "")}`
              : undefined,
          routeId: effectiveWantsTransport ? selectedRouteId : null,
          stopId: effectiveWantsTransport && selectedStopId ? selectedStopId : null,
          seats: effectiveWantsTransport ? seatsCount : null,
          wantsCertificate: effectiveWantsCertificate,
          guests: guests.map((g) => ({
            name: g.name.trim(),
            phone: g.phone ? `+51${g.phone.replace(/\D/g, "")}` : null,
          })),
        };

        const result = await registerForEvent(payload);
        if (result.success) {
          setOptimisticStatus(result.status);
          if (result.holdExpiresAt) setCurrentHoldExpiresAt(result.holdExpiresAt);
          if (result.requiresPayment) setOptimisticPaymentStatus("pending");

          toastRegistrationSuccess(result, { withTransport: effectiveWantsTransport });
          setIsModalOpen(false);
          clearRegistrationDraft();

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
      } catch (error) {
        setOptimisticStatus(null);
        toast.error(
          error instanceof Error
            ? mapRegistrationError(error.message)
            : t("register.registrationFailed"),
        );
      }
    });
  };

  const handleDirectRegister = (waitlist: boolean) => {
    startTransition(async () => {
      try {
        const result = await registerForEvent({
          eventId,
          scheduleId: effectiveScheduleId || null,
        });
        if (result.success) {
          setOptimisticStatus(result.status);
          if (waitlist) {
            toast.success(t("register.addedToWaitlist"));
            router.refresh();
            return;
          }
          if (result.holdExpiresAt) setCurrentHoldExpiresAt(result.holdExpiresAt);
          if (result.requiresPayment) setOptimisticPaymentStatus("pending");
          toastRegistrationSuccess(result);
          if (result.status === "waitlisted") {
            router.refresh();
          } else if (result.requiresPayment && result.registrationId) {
            router.push(paymentCheckoutPath(result.registrationId));
          } else {
            router.push(getAttendeeDestination(role, "tickets", { eventSlug }));
          }
        }
      } catch (error) {
        setOptimisticStatus(null);
        toast.error(
          error instanceof Error
            ? mapRegistrationError(error.message)
            : t("register.registrationFailed"),
        );
      }
    });
  };

  return {
    handleRegisterSubmit,
    handleDirectRegister,
    toastRegistrationSuccess,
    mapRegistrationError,
  };
}
