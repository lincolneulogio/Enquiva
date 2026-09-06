"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/components/providers/LocaleProvider";
import { useSession } from "@/lib/auth/client";
import {
  type RegisterButtonProps,
  RegistrationStatusBanner,
  useHoldCountdown,
  useRegistrationCancel,
  useRegistrationSubmit,
  useRegistrationDraft,
} from "./register";
import { RegisterActionModal } from "./register/modal/RegisterActionModal";
import { RegisterLoginPrompt } from "./register/ui/RegisterLoginPrompt";
import { RegisterClosedCard } from "./register/ui/RegisterClosedCard";
import { RegisterActionButton } from "./register/ui/RegisterActionButton";

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
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const draft = useRegistrationDraft({
    eventId,
    schedules,
    transportRoutes,
    isTransportAvailable,
    hasCertificate,
    certificatePrice,
    eventPrice,
  });

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
    effectiveScheduleId: draft.effectiveScheduleId,
    hasMultipleSchedules,
    effectiveWantsTransport: draft.effectiveWantsTransport,
    contactPhone: draft.contactPhone,
    selectedRouteId: draft.selectedRouteId,
    selectedStopId: draft.selectedStopId,
    seatsCount: draft.seatsCount,
    effectiveWantsCertificate: draft.effectiveWantsCertificate,
    guests: draft.guests,
    role,
    startTransition,
    setOptimisticStatus,
    setCurrentHoldExpiresAt,
    setOptimisticPaymentStatus,
    setIsModalOpen,
    clearRegistrationDraft: draft.clearRegistrationDraft,
    router,
    t,
  });

  const renderModal = () => (
    <RegisterActionModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSubmit={handleRegisterSubmit}
      isPending={isPending}
      hasMultipleSchedules={hasMultipleSchedules}
      schedules={schedules}
      draft={draft}
      isTransportAvailable={isTransportAvailable}
      hasTransportEnabledWithoutRoutes={hasTransportEnabledWithoutRoutes}
      transportRoutes={transportRoutes}
      hasCertificate={hasCertificate}
      certificateTitle={certificateTitle}
      certificatePrice={certificatePrice}
      eventPrice={eventPrice}
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
    return <RegisterClosedCard closedReason={closedReason} t={t} />;
  }

  if (!isAuthenticated) {
    return <RegisterLoginPrompt eventSlug={eventSlug} t={t} />;
  }

  return (
    <div className="space-y-3">
      <RegisterActionButton
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
        waitlistAvailable={waitlistAvailable}
        buttonText={buttonText}
        buttonClassName={buttonClassName}
        t={t}
      />
      {renderModal()}
    </div>
  );
}
