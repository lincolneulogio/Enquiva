"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerForEvent, cancelRegistration } from "@/actions/registrations";
import Swal from "@/lib/ui/swal-client";
import { Loader2, ArrowRight } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import Link from "next/link";
import { translateRegistrationError } from "@/lib/errors/registration";
import { confirmDeleteAction } from "@/lib/ui/confirm";
import { usePersistedFormFields } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { useSession } from "@/lib/auth/client";
import {
  getAttendeeDestination,
  paymentCheckoutPath,
} from "@/lib/navigation/attendee-paths";
import {
  RegisterButtonProps,
  RegistrationModal,
  RegistrationStatusBanner,
} from "./register";

export type { RegisterButtonProps } from "./register/types";

export function RegisterButton({
  eventId,
  isAuthenticated,
  isRegistrationClosed = false,
  waitlistAvailable = false,
  closedReason = null,
  hasTransport = false,
  currentStatus = null,
  registrationId,
  transportRoutes = [],
  eventPrice = 0,
  paymentStatus = null,
  holdExpiresAt = null,
  eventSlug,
  schedules = null,
  hasCertificate = false,
  certificateTitle = null,
  certificatePrice = 0,
  buttonText,
  buttonClassName,
}: RegisterButtonProps) {
  const router = useRouter();
  const t = useTranslations();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState(currentStatus);
  const [optimisticPaymentStatus, setOptimisticPaymentStatus] = useState(paymentStatus);
  const [currentHoldExpiresAt, setCurrentHoldExpiresAt] = useState<string | null>(
    holdExpiresAt
      ? holdExpiresAt instanceof Date
        ? holdExpiresAt.toISOString()
        : String(holdExpiresAt)
      : null,
  );

  useEffect(() => {
    setOptimisticStatus(currentStatus);
  }, [currentStatus]);

  useEffect(() => {
    setOptimisticPaymentStatus(paymentStatus);
  }, [paymentStatus]);

  useEffect(() => {
    setCurrentHoldExpiresAt(
      holdExpiresAt
        ? holdExpiresAt instanceof Date
          ? holdExpiresAt.toISOString()
          : String(holdExpiresAt)
        : null,
    );
  }, [holdExpiresAt]);

  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(() => {
    if (!currentHoldExpiresAt) return null;
    const diff = Math.floor((new Date(currentHoldExpiresAt).getTime() - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  });

  useEffect(() => {
    if (
      !currentHoldExpiresAt ||
      optimisticPaymentStatus === "approved" ||
      (optimisticStatus !== "registered" && optimisticStatus !== null)
    ) {
      setSecondsRemaining(null);
      return;
    }

    const calcRemaining = () => {
      const diff = Math.floor((new Date(currentHoldExpiresAt).getTime() - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    };

    const initial = calcRemaining();
    setSecondsRemaining(initial);

    if (initial <= 0) return;

    const interval = setInterval(() => {
      const remaining = calcRemaining();
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        toast.error(t("register.holdExpiredToast") || "Tu reserva temporal ha expirado y el cupo fue liberado.");
        router.refresh();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentHoldExpiresAt, optimisticPaymentStatus, optimisticStatus, router, t]);
  
  const hasMultipleSchedules = Array.isArray(schedules) && schedules.length > 1;
  const isTransportAvailable = Boolean(hasTransport && transportRoutes && transportRoutes.length > 0);
  const hasTransportEnabledWithoutRoutes = Boolean(hasTransport && (!transportRoutes || transportRoutes.length === 0));
  const shouldOpenModal = Boolean(hasMultipleSchedules || hasTransport || hasCertificate);

  // Modal states & form draft persistence
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { values: registrationDraft, setValue: setRegistrationValue, setValues: setRegistrationValues, clear: clearRegistrationDraft } = usePersistedFormFields(
    formStorageKey(`event.register.${eventId}`),
    {
      selectedScheduleId: schedules && schedules.length > 0 ? schedules[0].id : "",
      wantsTransport: false,
      selectedRouteId: "",
      selectedStopId: "",
      seatsCount: 1,
      contactPhone: "",
      guests: [] as Array<{ name: string; phone: string }>,
      wantsCertificate: false,
    },
  );
  const { selectedScheduleId, wantsTransport, selectedRouteId, selectedStopId, seatsCount, contactPhone, guests, wantsCertificate } = registrationDraft;

  // Si hay horarios disponibles y el guardado en draft es inválido o vacío, sincronizar con el primero
  useEffect(() => {
    if (schedules && schedules.length > 0) {
      const exists = schedules.some((s) => s.id === selectedScheduleId);
      if (!exists) {
        setRegistrationValue("selectedScheduleId", schedules[0].id);
      }
    }
  }, [schedules, selectedScheduleId, setRegistrationValue]);

  // Si no hay transporte disponible para este evento pero el draft guardó wantsTransport, desactivarlo
  useEffect(() => {
    if (!isTransportAvailable && wantsTransport) {
      setRegistrationValue("wantsTransport", false);
    }
  }, [isTransportAvailable, wantsTransport, setRegistrationValue]);

  // Sincronizar automáticamente la cantidad de asientos de bus con el titular + invitados
  useEffect(() => {
    setRegistrationValue("seatsCount", 1 + guests.length);
  }, [guests.length, setRegistrationValue]);

  // Select first route by default if routes exist
  useEffect(() => {
    if (transportRoutes.length > 0 && !selectedRouteId) {
      setRegistrationValue("selectedRouteId", transportRoutes[0].id);
    }
  }, [transportRoutes, selectedRouteId, setRegistrationValue]);

  const mapRegistrationError = (message: string) => translateRegistrationError(t, message);

  const toastRegistrationSuccess = (result: {
    status?: string;
    requiresPayment?: boolean;
    holdMinutes?: number | null;
  }, opts?: { withTransport?: boolean }) => {
    if (result.status === "waitlisted") {
      toast.success(t("register.addedToWaitlist"));
      return;
    }
    if (result.requiresPayment && result.holdMinutes) {
      toast.success(t("register.registrationHoldSuccess", { minutes: result.holdMinutes }));
      return;
    }
    toast.success(
      opts?.withTransport
        ? t("register.registrationWithTransportSuccess")
        : t("register.registrationSuccess"),
    );
  };

  const effectiveScheduleId = selectedScheduleId || (schedules && schedules[0]?.id) || "";
  const selectedSlot = schedules?.find((s) => s.id === effectiveScheduleId);

  const activeRoute = isTransportAvailable ? transportRoutes.find((r) => r.id === selectedRouteId) : undefined;
  const transportPricePerSeat = activeRoute ? Number(activeRoute.pricePerSeat) : 0;
  const effectiveWantsTransport = Boolean(isTransportAvailable && wantsTransport);
  const transportTotalCost = effectiveWantsTransport ? transportPricePerSeat * seatsCount : 0;
  const effectiveWantsCertificate = Boolean(hasCertificate && wantsCertificate);
  const certificateTotalCost = effectiveWantsCertificate ? Number(certificatePrice || 0) : 0;
  const consolidatedTotalCost = (eventPrice * (1 + guests.length)) + transportTotalCost + certificateTotalCost;

  const handleRegisterSubmit = () => {
    if (hasMultipleSchedules && !effectiveScheduleId) {
      toast.error(t("register.selectedScheduleRequired"));
      return;
    }

    // Basic phone validation if transport selected
    if (effectiveWantsTransport) {
      if (contactPhone.trim() === "") {
        toast.error(t("register.phoneRequiredForTransport"));
        return;
      }
      const cleanPhone = contactPhone.replace(/\D/g, "");
      if (cleanPhone.length !== 9 || !cleanPhone.startsWith("9")) {
        toast.error(t("register.phoneMustBePeruMobile"));
        return;
      }

      // Validar también teléfonos de invitados si se ingresaron
      for (let i = 0; i < guests.length; i++) {
        const guest = guests[i];
        if (guest.phone) {
          const cleanGuestPhone = guest.phone.replace(/\D/g, "");
          if (cleanGuestPhone.length !== 9 || !cleanGuestPhone.startsWith("9")) {
            toast.error(
              t("register.guestPhoneInvalid", { index: i + 1, name: guest.name }),
            );
            return;
          }
        }
      }
    }

    // Validar nombres de invitados
    for (let i = 0; i < guests.length; i++) {
      if (guests[i].name.trim().length < 2) {
        toast.error(t("register.guestNameInvalid", { index: i + 1 }));
        return;
      }
    }
 
    startTransition(async () => {
      try {
        const payload = {
          eventId,
          scheduleId: effectiveScheduleId || null,
          contactPhone: effectiveWantsTransport && contactPhone ? `+51${contactPhone.replace(/\D/g, "")}` : undefined,
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
          if (result.holdExpiresAt) {
            setCurrentHoldExpiresAt(result.holdExpiresAt);
          }
          if (result.requiresPayment) {
            setOptimisticPaymentStatus("pending");
          }
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
            : t("register.registrationFailed")
        );
      }
    });
  };

  const handleCancelClick = async () => {
    // 1. Confirm cancellation with the user first
    const confirmed = await confirmDeleteAction({
      title: t("register.cancelRegistrationTitle"),
      text: t("register.cancelRegistrationText"),
      confirmText: t("register.cancelConfirmContinue"),
      cancelText: t("register.cancelKeepActive"),
      tone: "danger",
    });

    if (!confirmed) return;

    // 2. Request user's password for security verification using a custom premium SweetAlert2 dialog
    const { value: password, isConfirmed } = await Swal.fire({
      title: t("register.securityVerificationTitle"),
      text: t("register.securityVerificationText"),
      input: "password",
      inputPlaceholder: t("register.passwordPlaceholder"),
      inputAttributes: {
        autocapitalize: "off",
        autocorrect: "off",
        required: "true",
      },
      showCancelButton: true,
      confirmButtonText: t("register.confirmCancellation"),
      cancelButtonText: t("common.cancel"),
      reverseButtons: true,
      buttonsStyling: false,
      focusCancel: true,
      customClass: {
        popup: "fe-swal-popup fe-swal-popup--danger",
        title: "fe-swal-title",
        htmlContainer: "fe-swal-text",
        input: "w-full mt-4 px-3.5 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-card text-foreground transition-all placeholder:text-muted-foreground",
        actions: "fe-swal-actions mt-6",
        confirmButton: "fe-swal-confirm fe-swal-confirm--danger",
        cancelButton: "fe-swal-cancel",
      },
      inputValidator: (value) => {
        if (!value) {
          return t("register.passwordRequiredContinue");
        }
      }
    });

    if (!isConfirmed || !password) return;

    // 3. Process cancellation in transition with the server action
    startTransition(async () => {
      setOptimisticStatus("cancelled");
      setCurrentHoldExpiresAt(null);
      try {
        const result = await cancelRegistration(registrationId!, password);
        if (result.success) {
          toast.success(t("register.registrationCancelled"));
          router.refresh();
        } else {
          throw new Error(t("register.wrongPassword"));
        }
      } catch (error) {
        setOptimisticStatus("registered");
        const errorMessage = error instanceof Error ? error.message : t("register.registrationCancelFailed");
        
        // Show premium red SweetAlert2 error dialog if password was incorrect
        await Swal.fire({
          title: t("register.securityErrorTitle"),
          text: errorMessage.includes("Contraseña") || errorMessage.includes("incorrecta") || errorMessage.toLowerCase().includes("password")
            ? t("register.wrongPasswordKeepActive")
            : t("register.cancelFailedRetry"),
          icon: "error",
          confirmButtonText: t("register.understood"),
          buttonsStyling: false,
          customClass: {
            popup: "fe-swal-popup fe-swal-popup--danger",
            title: "fe-swal-title",
            htmlContainer: "fe-swal-text",
            actions: "fe-swal-actions mt-4",
            confirmButton: "fe-swal-confirm fe-swal-confirm--danger",
          }
        });
      }
    });
  };

  const handleRegisterAgain = () => {
    if (shouldOpenModal) {
      setIsModalOpen(true);
      return;
    }
    startTransition(async () => {
      try {
        const result = await registerForEvent({ 
          eventId,
          scheduleId: effectiveScheduleId || null,
        });
        if (result.success) {
          setOptimisticStatus(result.status);
          if (result.holdExpiresAt) {
            setCurrentHoldExpiresAt(result.holdExpiresAt);
          }
          if (result.requiresPayment) {
            setOptimisticPaymentStatus("pending");
          }
          toastRegistrationSuccess(result);
          if (result.requiresPayment && result.registrationId) {
            router.push(paymentCheckoutPath(result.registrationId));
          } else if (result.status === "registered") {
            router.push(
              getAttendeeDestination(role, "tickets", { eventSlug }),
            );
          }
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? mapRegistrationError(error.message)
            : t("register.registrationFailed")
        );
      }
    });
  };

  const renderModal = () => (
    <RegistrationModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSubmit={handleRegisterSubmit}
      isPending={isPending}
      hasMultipleSchedules={hasMultipleSchedules}
      schedules={schedules}
      selectedScheduleId={selectedScheduleId}
      onSelectSchedule={(id) => setRegistrationValue("selectedScheduleId", id)}
      selectedSlot={selectedSlot}
      isTransportAvailable={isTransportAvailable}
      hasTransportEnabledWithoutRoutes={hasTransportEnabledWithoutRoutes}
      transportRoutes={transportRoutes}
      wantsTransport={wantsTransport}
      selectedRouteId={selectedRouteId}
      selectedStopId={selectedStopId}
      contactPhone={contactPhone}
      onSetWantsTransport={(wants) => {
        if (!wants) {
          setRegistrationValues((prev) => ({
            ...prev,
            wantsTransport: false,
            seatsCount: 1,
          }));
        } else {
          setRegistrationValue("wantsTransport", true);
        }
      }}
      onSelectRoute={(routeId) => {
        setRegistrationValues((prev) => ({
          ...prev,
          selectedRouteId: routeId,
          selectedStopId: "",
        }));
      }}
      onSelectStop={(stopId) => setRegistrationValue("selectedStopId", stopId)}
      onChangeContactPhone={(phone) => setRegistrationValue("contactPhone", phone)}
      seatsCount={seatsCount}
      transportTotalCost={transportTotalCost}
      guests={guests}
      onChangeGuests={(newGuests) => setRegistrationValue("guests", newGuests)}
      hasCertificate={hasCertificate}
      certificateTitle={certificateTitle}
      certificatePrice={certificatePrice}
      wantsCertificate={wantsCertificate}
      onToggleCertificate={() => setRegistrationValue("wantsCertificate", !wantsCertificate)}
      eventPrice={eventPrice}
      consolidatedTotalCost={consolidatedTotalCost}
      t={t}
    />
  );

  // Status banner states (registered, checked_in, waitlisted, cancelled)
  if (optimisticStatus) {
    return (
      <RegistrationStatusBanner
        optimisticStatus={optimisticStatus}
        optimisticPaymentStatus={optimisticPaymentStatus}
        currentHoldExpiresAt={currentHoldExpiresAt}
        secondsRemaining={secondsRemaining}
        registrationId={registrationId}
        isRegistrationClosed={isRegistrationClosed}
        closedReason={closedReason}
        waitlistAvailable={waitlistAvailable}
        isPending={isPending}
        onRegisterAgain={handleRegisterAgain}
        onCancelClick={handleCancelClick}
        renderModal={renderModal}
        t={t}
      />
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
          href={`/login?redirect=${encodeURIComponent(eventSlug ? `/events/${eventSlug}` : "/events")}`}
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
          if (waitlistAvailable) {
            startTransition(async () => {
              try {
                const result = await registerForEvent({ 
                  eventId,
                  scheduleId: effectiveScheduleId || null,
                });
                if (result.success) {
                  setOptimisticStatus(result.status);
                  toast.success(t("register.addedToWaitlist"));
                  router.refresh();
                }
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? mapRegistrationError(error.message)
                    : t("register.registrationFailed"),
                );
              }
            });
            return;
          }

          if (shouldOpenModal) {
            setIsModalOpen(true);
          } else {
            // Register directly
            startTransition(async () => {
              try {
                const result = await registerForEvent({ 
                  eventId,
                  scheduleId: effectiveScheduleId || null,
                });
                if (result.success) {
                  setOptimisticStatus(result.status);
                  toastRegistrationSuccess(result);
                  if (result.status === "waitlisted") {
                    router.refresh();
                  } else if (result.requiresPayment && result.registrationId) {
                    router.push(paymentCheckoutPath(result.registrationId));
                  } else {
                    router.push(
                      getAttendeeDestination(role, "tickets", { eventSlug }),
                    );
                  }
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
          }
        }}
        disabled={isPending}
        className={
          buttonClassName ||
          "flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-bold text-primary-foreground transition-all hover:bg-primary/90 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 active:scale-98 cursor-pointer"
        }
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : waitlistAvailable ? (
          t("register.joinWaitlist")
        ) : buttonText ? (
          <span className="flex items-center gap-2">
            <span>{buttonText}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span>{t("register.registerNow")}</span>
            <ArrowRight className="h-4 w-4" />
          </span>
        )}
      </button>

      {/* Unified Registration & Transport Selection Modal */}
      {renderModal()}
    </div>
  );
}
