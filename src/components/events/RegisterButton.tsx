"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import Link from "next/link";
import { usePersistedFormFields } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { useSession } from "@/lib/auth/client";
import {
  RegisterButtonProps,
  RegistrationModal,
  RegistrationStatusBanner,
  useHoldCountdown,
  useRegistrationCancel,
  useRegistrationSubmit,
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

  useEffect(() => {
    setOptimisticStatus(currentStatus);
  }, [currentStatus]);

  useEffect(() => {
    setOptimisticPaymentStatus(paymentStatus);
  }, [paymentStatus]);

  const { currentHoldExpiresAt, setCurrentHoldExpiresAt, secondsRemaining } =
    useHoldCountdown({
      initialHoldExpiresAt: holdExpiresAt,
      optimisticPaymentStatus,
      optimisticStatus,
      router,
      t,
    });

  const hasMultipleSchedules = Array.isArray(schedules) && schedules.length > 1;
  const isTransportAvailable = Boolean(hasTransport && transportRoutes && transportRoutes.length > 0);
  const hasTransportEnabledWithoutRoutes = Boolean(hasTransport && (!transportRoutes || transportRoutes.length === 0));
  const shouldOpenModal = Boolean(hasMultipleSchedules || hasTransport || hasCertificate);

  // Modal states & form draft persistence
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    values: registrationDraft,
    setValue: setRegistrationValue,
    setValues: setRegistrationValues,
    clear: clearRegistrationDraft,
  } = usePersistedFormFields(
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

  useEffect(() => {
    if (schedules && schedules.length > 0 && !schedules.some((s) => s.id === selectedScheduleId)) {
      setRegistrationValue("selectedScheduleId", schedules[0].id);
    }
  }, [schedules, selectedScheduleId, setRegistrationValue]);

  useEffect(() => {
    if (!isTransportAvailable && wantsTransport) {
      setRegistrationValue("wantsTransport", false);
    }
  }, [isTransportAvailable, wantsTransport, setRegistrationValue]);

  useEffect(() => {
    setRegistrationValue("seatsCount", 1 + guests.length);
  }, [guests.length, setRegistrationValue]);

  useEffect(() => {
    if (transportRoutes.length > 0 && !selectedRouteId) {
      setRegistrationValue("selectedRouteId", transportRoutes[0].id);
    }
  }, [transportRoutes, selectedRouteId, setRegistrationValue]);

  const effectiveScheduleId = selectedScheduleId || (schedules && schedules[0]?.id) || "";
  const selectedSlot = schedules?.find((s) => s.id === effectiveScheduleId);
  const activeRoute = isTransportAvailable ? transportRoutes.find((r) => r.id === selectedRouteId) : undefined;
  const transportPricePerSeat = activeRoute ? Number(activeRoute.pricePerSeat) : 0;
  const effectiveWantsTransport = Boolean(isTransportAvailable && wantsTransport);
  const transportTotalCost = effectiveWantsTransport ? transportPricePerSeat * seatsCount : 0;
  const effectiveWantsCertificate = Boolean(hasCertificate && wantsCertificate);
  const certificateTotalCost = effectiveWantsCertificate ? Number(certificatePrice || 0) : 0;
  const consolidatedTotalCost = (eventPrice * (1 + guests.length)) + transportTotalCost + certificateTotalCost;

  const { handleCancelClick } = useRegistrationCancel({
    registrationId,
    setOptimisticStatus,
    setCurrentHoldExpiresAt,
    startTransition,
    router,
    t,
  });

  const { handleRegisterSubmit, handleDirectRegister } = useRegistrationSubmit({
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
  });

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
          setRegistrationValues((prev) => ({ ...prev, wantsTransport: false, seatsCount: 1 }));
        } else {
          setRegistrationValue("wantsTransport", true);
        }
      }}
      onSelectRoute={(routeId) => {
        setRegistrationValues((prev) => ({ ...prev, selectedRouteId: routeId, selectedStopId: "" }));
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
        onRegisterAgain={() => {
          if (shouldOpenModal) setIsModalOpen(true);
          else handleDirectRegister(false);
        }}
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
        <p className="mb-3 text-sm text-muted-foreground">{t("register.signInToRegister")}</p>
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
            handleDirectRegister(true);
            return;
          }
          if (shouldOpenModal) {
            setIsModalOpen(true);
          } else {
            handleDirectRegister(false);
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

      {renderModal()}
    </div>
  );
}
