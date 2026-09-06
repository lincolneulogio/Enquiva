"use client";

import { type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";
import { registerForEvent } from "@/actions/registrations";
import { translateRegistrationError } from "@/lib/errors/registration";
import type { GuestInput } from "../types";
import { validateRegistrationInputs } from "./helpers/validateRegistrationInputs";
import {
  toastRegistrationSuccess as showSuccessToast,
  routeAfterRegistration,
  type RegistrationResultLike,
} from "./helpers/handleRegistrationRouting";

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
  guests: GuestInput[];
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
    result: RegistrationResultLike,
    opts?: { withTransport?: boolean },
  ) => {
    showSuccessToast(result, t, opts);
  };

  const handleRegisterSubmit = () => {
    const isValid = validateRegistrationInputs({
      hasMultipleSchedules,
      effectiveScheduleId,
      effectiveWantsTransport,
      contactPhone,
      guests,
      t,
    });
    if (!isValid) return;

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

          routeAfterRegistration({
            result,
            role,
            eventSlug,
            effectiveWantsTransport,
            router,
            t,
          });
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
          routeAfterRegistration({
            result,
            role,
            eventSlug,
            router,
            t,
          });
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
