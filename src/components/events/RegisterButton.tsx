"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerForEvent, cancelRegistration } from "@/actions/registrations";
import Swal from "@/lib/ui/swal-client";
import { 
  Loader2, 
  CheckCircle, 
  Clock, 
  Bus, 
  Users, 
  X, 
  AlertTriangle, 
  Check, 
  Calendar, 
  MapPin, 
  Info,
  Sparkles,
  ArrowRight,
  CreditCard,
  Award
} from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { translateRegistrationError } from "@/lib/errors/registration";
import { confirmDeleteAction } from "@/lib/ui/confirm";
import { usePersistedFormFields } from "@/hooks/useFormPersistence";
import { formStorageKey } from "@/lib/form-persistence";
import { useSession } from "@/lib/auth/client";
import {
  getAttendeeDestination,
  paymentCheckoutPath,
} from "@/lib/navigation/attendee-paths";

interface RegisterButtonProps {
  eventId: string;
  isAuthenticated: boolean;
  isRegistrationClosed?: boolean;
  waitlistAvailable?: boolean;
  closedReason?: string | null;
  hasTransport?: boolean;
  currentStatus?: "registered" | "waitlisted" | "checked_in" | "cancelled" | null;
  registrationId?: string;
  transportRoutes?: Array<{
    id: string;
    eventId: string;
    name: string;
    departurePoint: string;
    departureTime: string;
    returnTime: string | null;
    pricePerSeat: string;
    totalSeats: number;
    availableSeats?: number;
    description: string | null;
    isActive: boolean;
    isRoundTrip?: boolean;
    stops?: Array<{
      id: string;
      name: string;
      latitude: string | null;
      longitude: string | null;
      sortOrder?: number;
      estimatedArrivalTime?: string | null;
      maxSeats?: number | null;
    }>;
  }>;
  eventPrice?: number;
  paymentStatus?: "pending" | "approved" | "rejected" | null;
  holdExpiresAt?: string | Date | null;
  eventSlug?: string;
  schedules?: Array<{
    id: string;
    label?: string | null;
    date: string;
    endDate?: string | null;
  }> | null;
  hasCertificate?: boolean;
  certificateTitle?: string | null;
  certificatePrice?: number | null;
  buttonText?: string;
  buttonClassName?: string;
}

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Modal states
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
  const [visualHeight, setVisualHeight] = useState("90vh");

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

  // Dynamic visual viewport height adjustment (e.g. when keyboard opens on mobile)
  useEffect(() => {
    if (!isModalOpen || typeof window === "undefined" || !window.visualViewport) return;

    const handleResize = () => {
      const vv = window.visualViewport;
      if (vv) {
        // Set max height to 92% of actual visible viewport to leave spacing
        setVisualHeight(`${vv.height * 0.92}px`);
      }
    };

    window.visualViewport.addEventListener("resize", handleResize);
    window.visualViewport.addEventListener("scroll", handleResize);
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
    };
  }, [isModalOpen]);

  // Select first route by default if routes exist
  useEffect(() => {
    if (transportRoutes.length > 0 && !selectedRouteId) {
      setRegistrationValue("selectedRouteId", transportRoutes[0].id);
    }
  }, [transportRoutes, selectedRouteId, setRegistrationValue]);

  // Lock body scroll when modal is open to hide scrollbar and prevent background scrolling
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (isModalOpen) {
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      if (typeof window !== "undefined" && window.__enquivaLenis) {
        window.__enquivaLenis.stop();
      }
    } else {
      html.style.overflow = "";
      body.style.overflow = "";
      if (typeof window !== "undefined" && window.__enquivaLenis) {
        window.__enquivaLenis.start();
      }
    }
    return () => {
      html.style.overflow = "";
      body.style.overflow = "";
      if (typeof window !== "undefined" && window.__enquivaLenis) {
        window.__enquivaLenis.start();
      }
    };
  }, [isModalOpen]);

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

  const formatSlotDateTime = (dateStr: string, endDateStr?: string | null) => {
    try {
      const date = new Date(dateStr);
      const formattedDate = date.toLocaleDateString("es-PE", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      const formattedStart = date.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const formattedEnd = endDateStr
        ? new Date(endDateStr).toLocaleTimeString("es-PE", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : null;
      return {
        dateLabel: formattedDate,
        timeLabel: formattedEnd ? `${formattedStart} - ${formattedEnd}` : formattedStart,
      };
    } catch {
      return { dateLabel: dateStr, timeLabel: "" };
    }
  };

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

  const formatRouteTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
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

  if (optimisticStatus === "registered" || optimisticStatus === "checked_in") {
    if (optimisticStatus === "checked_in") {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            {t("register.checkedIn")}
          </div>
        </div>
      );
    }

    // 1. Si el pago ya fue aprobado
    if (optimisticPaymentStatus === "approved") {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            {t("register.youreRegistered")}
          </div>
          {registrationId && (
            <div className="rounded-xl bg-muted/60 p-3 border border-border/80 text-center text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">{t("register.paidConfirmedTitle")}</span>
              <p className="mt-0.5 text-[11px]">{t("register.paidConfirmedHelp")}</p>
            </div>
          )}
        </div>
      );
    }

    // 2. Si requiere pago o tiene reserva temporal (hold) y el hold ya expiró (secondsRemaining === 0)
    if (currentHoldExpiresAt && secondsRemaining === 0) {
      return (
        <div className="space-y-3">
          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 dark:bg-destructive/10 p-4 text-center space-y-1.5 shadow-xs">
            <div className="flex items-center justify-center gap-2 text-destructive font-bold text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>{t("register.holdExpiredTitle") || "Tu reserva temporal expiró"}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("register.holdExpiredText") || "El tiempo límite para pagar finalizó y tu cupo fue liberado. Puedes volver a inscribirte si aún hay cupos disponibles."}
            </p>
          </div>

          {isRegistrationClosed ? (
            <div className="rounded-xl bg-muted/60 p-3 border border-border text-center text-xs text-muted-foreground">
              {closedReason || t("register.errors.eventExpired")}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleRegisterAgain}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 px-6 text-sm font-bold shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>{waitlistAvailable ? t("register.joinWaitlist") : (t("register.reserveAgain") || t("register.registerAgain"))}</span>
                </>
              )}
            </button>
          )}
          {renderRegistrationModal()}
        </div>
      );
    }

    // 3. Si requiere pago o tiene reserva temporal (hold) y el hold SIGUE ACTIVO (secondsRemaining > 0)
    if (currentHoldExpiresAt && secondsRemaining !== null && secondsRemaining > 0) {
      const minutes = Math.floor(secondsRemaining / 60);
      const seconds = secondsRemaining % 60;
      const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      const isUrgent = secondsRemaining < 300;

      return (
        <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 p-4 shadow-xs">
          <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
              <Clock className="h-4 w-4 animate-pulse text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate">{t("register.holdPendingTitle") || "Cupo reservado · Pago pendiente"}</span>
            </div>
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold tracking-tight shadow-xs shrink-0",
                isUrgent
                  ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 animate-pulse"
                  : "bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30",
              )}
            >
              <span className="text-[11px] opacity-80">⏱️</span>
              <span>{formattedTime}</span>
            </div>
          </div>

          <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
            {t("register.holdNotice") || "Completa tu pago antes de que expire el tiempo o tu cupo se liberará automáticamente."}
          </p>

          {registrationId && (
            <Link
              href={paymentCheckoutPath(registrationId)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 text-sm font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-98 transition-all cursor-pointer"
            >
              <CreditCard className="h-4 w-4" />
              <span>{t("register.completePayment") || "Completar pago ahora"}</span>
              <ArrowRight className="h-4 w-4 ml-auto opacity-80" />
            </Link>
          )}

          {registrationId && (
            <button
              type="button"
              onClick={handleCancelClick}
              disabled={isPending}
              className="block w-full text-center text-xs text-muted-foreground hover:text-destructive transition-colors py-1 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="mx-auto h-3 w-3 animate-spin" />
              ) : (
                t("register.cancelHold") || t("register.cancelRegistration")
              )}
            </button>
          )}
        </div>
      );
    }

    // 4. Si es evento gratuito (sin hold ni pago pendiente)
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          {t("register.youreRegistered")}
        </div>
        {registrationId && (
          <button
            onClick={handleCancelClick}
            disabled={isPending}
            className="block w-full rounded-xl border border-border py-2 text-center text-xs text-muted-foreground hover:border-destructive hover:text-destructive transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="mx-auto h-3 w-3 animate-spin" /> : t("register.cancelRegistration")}
          </button>
        )}
      </div>
    );
  }

  if (optimisticStatus === "cancelled") {
    return (
      <div className="space-y-2">
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-center text-sm text-muted-foreground">
          {t("register.cancelledCanRejoin")}
        </div>
        <button
          type="button"
          onClick={handleRegisterAgain}
          disabled={isPending}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("register.registerAgain")}
        </button>
        {renderRegistrationModal()}
      </div>
    );
  }

  if (optimisticStatus === "waitlisted") {
    return (
      <div className="space-y-2 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
        <div className="flex items-center justify-center gap-2 font-medium">
          <Clock className="h-4 w-4" />
          {t("register.onWaitlist")}
        </div>
        <p className="text-center text-xs text-amber-700/90 dark:text-amber-300/90">
          {t("register.waitlistNoExtras")}
        </p>
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
      {renderRegistrationModal()}
    </div>
  );

  function renderRegistrationModal() {
    if (!isModalOpen || !mounted || typeof document === "undefined") {
      return null;
    }

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn">
        <div 
          style={{ maxHeight: visualHeight }}
          className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scaleUp transition-[max-height] duration-200"
        >
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base">{t("register.modalTitle")}</h3>
                  <p className="text-xs text-muted-foreground">{t("register.modalSubtitle")}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm flex-1" data-lenis-prevent>
              
              {/* Schedule / Shift Selection (Opción 1: Elección de Turno / Horario) */}
              {hasMultipleSchedules && schedules && schedules.length > 0 && (
                <div className="space-y-3">
                  <div className="space-y-1 text-left">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-primary" />
                      {t("register.scheduleSelectionTitle")}
                    </label>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t("register.scheduleSelectionHelp")}
                    </p>
                  </div>

                  <div className="grid gap-2.5 pt-1">
                    {schedules.map((slot, index) => {
                      const isSelected = effectiveScheduleId === slot.id;
                      const { dateLabel, timeLabel } = formatSlotDateTime(slot.date, slot.endDate);

                      return (
                        <div
                          key={slot.id}
                          onClick={() => setRegistrationValue("selectedScheduleId", slot.id)}
                          className={`group cursor-pointer rounded-2xl border p-4 transition-all duration-200 text-left flex items-center justify-between gap-3 ${
                            isSelected
                              ? "border-primary bg-primary/10 dark:bg-primary/20 ring-2 ring-primary shadow-sm"
                              : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                          }`}
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-foreground">
                                {slot.label || `Turno ${index + 1}`}
                              </span>
                              {isSelected && (
                                <span className="rounded-full bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider border border-primary/20">
                                  Seleccionado
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1 font-medium capitalize">
                                <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                                {dateLabel}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-semibold text-foreground/90">
                                <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                                {timeLabel}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            <div
                              className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/40 group-hover:border-primary/60"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Transport Availability & Options Section */}
              {isTransportAvailable ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Bus className="h-4 w-4 text-primary" />
                      {t("register.transportQuestion")}
                    </label>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 text-[11px] font-semibold border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {t("register.transportAvailableBadge")} ({transportRoutes.length} {transportRoutes.length === 1 ? "ruta" : "rutas"})
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("register.transportHelp")}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setRegistrationValue("wantsTransport", true)}
                      className={`flex items-center justify-center gap-2 rounded-xl py-3 border font-medium transition-all ${
                        wantsTransport
                          ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                          : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {wantsTransport && <Check className="h-4 w-4" />}
                      {t("register.transportYes")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRegistrationValues((prev) => ({
                          ...prev,
                          wantsTransport: false,
                          seatsCount: 1,
                        }));
                      }}
                      className={`flex items-center justify-center gap-2 rounded-xl py-3 border font-medium transition-all ${
                        !wantsTransport
                          ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                          : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {!wantsTransport && <Check className="h-4 w-4" />}
                      {t("register.transportNo")}
                    </button>
                  </div>
                </div>
              ) : hasTransportEnabledWithoutRoutes ? (
                /* Transporte habilitado por el organizador pero sin rutas activas */
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-2 text-left animate-fadeIn">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Bus className="h-4 w-4 text-amber-500" />
                      <span>{t("register.transportStatusTitle")}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 text-[11px] font-semibold border border-amber-500/25">
                      <Clock className="h-3 w-3" />
                      {t("register.transportPendingRoutesBadge")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("register.transportPendingRoutesHelp")}
                  </p>
                </div>
              ) : (
                /* No cuenta con servicio de transporte oficial */
                <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-2 text-left animate-fadeIn">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Bus className="h-4 w-4 text-muted-foreground" />
                      <span>{t("register.transportStatusTitle")}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-[11px] font-semibold border border-border">
                      <X className="h-3 w-3" />
                      {t("register.transportUnavailableBadge")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("register.transportNotAvailableHelp")}
                  </p>
                </div>
              )}

              {/* Dynamic Interactive Transport Section */}
              {effectiveWantsTransport && (
                <div className="space-y-5 p-4 rounded-2xl bg-muted/40 border border-border/80 animate-slideDown">
                  
                  {/* Route Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                      {t("register.selectRouteLabel")}
                    </label>
                    <div className="grid gap-3 pt-1">
                      {transportRoutes.map((route) => (
                        <div
                          key={route.id}
                          onClick={() => {
                            setRegistrationValues((prev) => ({
                              ...prev,
                              selectedRouteId: route.id,
                              selectedStopId: "",
                            }));
                          }}
                          className={`cursor-pointer rounded-xl border p-3.5 transition-all text-left flex flex-col gap-2 ${
                            selectedRouteId === route.id
                              ? "border-primary bg-primary/10 dark:bg-primary/20 ring-1 ring-primary"
                              : "border-border bg-card hover:border-muted-foreground/30"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <span className="font-semibold text-sm text-foreground">{route.name}</span>
                              {route.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{route.description}</p>
                              )}
                            </div>
                            <span className="font-bold text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-lg shrink-0">
                              {t("register.pricePerSeat", { price: Number(route.pricePerSeat).toFixed(2) })}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-[10px]">
                            <span className="rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 font-semibold">
                              {route.availableSeats ?? route.totalSeats} asientos libres
                            </span>
                            <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                              {route.isRoundTrip === false ? "Solo ida" : "Ida y vuelta"}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1.5 border-t border-border/40">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="truncate"><strong>{t("register.departureLabel")}</strong> {route.departurePoint}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span><strong>{t("register.departureTimeLabel")}</strong> {formatRouteTime(route.departureTime)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {activeRoute?.stops && activeRoute.stops.length > 0 && (
                    <div className="space-y-1.5">
                      <label
                        htmlFor="register-stop-id"
                        className="text-xs font-semibold text-foreground uppercase tracking-wider block"
                      >
                        {t("register.pickupStopOptional")}
                      </label>
                      <select
                        id="register-stop-id"
                        value={selectedStopId}
                        onChange={(e) => setRegistrationValue("selectedStopId", e.target.value)}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">{t("register.generalDeparturePoint", { point: activeRoute.departurePoint })}</option>
                        {[...activeRoute.stops]
                          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                          .map((stop, index) => (
                          <option key={stop.id} value={stop.id}>
                            {index + 1}. {stop.name}
                            {stop.estimatedArrivalTime
                              ? ` · ETA ${new Date(stop.estimatedArrivalTime).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`
                              : ""}
                            {stop.maxSeats != null ? ` (máx. ${stop.maxSeats})` : ""}
                          </option>
                        ))}
                      </select>
                      {selectedStopId && (() => {
                        const stop = activeRoute.stops?.find((s) => s.id === selectedStopId);
                        if (!stop?.latitude || !stop?.longitude) return null;
                        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${stop.latitude},${stop.longitude}`;
                        const waUrl = `https://wa.me/?text=${encodeURIComponent(`Paradero ${stop.name}: ${mapsUrl}`)}`;
                        return (
                          <div className="flex flex-wrap gap-2 pt-1">
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-primary hover:underline"
                            >
                              Cómo llegar (Maps)
                            </a>
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-emerald-600 hover:underline"
                            >
                              Compartir por WhatsApp
                            </a>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Contact Phone (Optional but highly recommended) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                      {t("register.contactPhoneForBus")}{" "}
                      <span className="text-rose-500 font-bold">{t("register.requiredMark")}</span>:
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-sm text-muted-foreground font-medium select-none pointer-events-none border-r border-border/80 pr-2.5">
                        +51
                      </span>
                      <input
                        type="tel"
                        maxLength={9}
                        placeholder="912345678"
                        value={contactPhone}
                        onChange={(e) => {
                          const onlyDigits = e.target.value.replace(/\D/g, "");
                          if (onlyDigits.length <= 9) {
                            setRegistrationValue("contactPhone", onlyDigits);
                          }
                        }}
                        style={{ paddingLeft: "54px" }}
                        className={`w-full pr-3 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 font-medium tracking-wide ${
                          contactPhone.length === 0
                            ? "border-border focus:ring-primary/20 focus:border-primary"
                            : contactPhone.length < 9
                            ? "border-amber-500/40 focus:ring-amber-500/20 focus:border-amber-500"
                            : !contactPhone.startsWith("9")
                            ? "border-rose-500/40 focus:ring-rose-500/20 focus:border-rose-500"
                            : "border-green-500/40 focus:ring-green-500/20 focus:border-green-500"
                        }`}
                      />
                    </div>
                    {contactPhone.length > 0 && (
                      <p className={`text-[10px] font-semibold transition-all duration-300 ${
                        contactPhone.length < 9
                          ? "text-amber-500"
                          : !contactPhone.startsWith("9")
                          ? "text-rose-500"
                          : "text-green-500"
                      }`}>
                        {contactPhone.length < 9
                          ? t("register.digitsMissing", {
                              count: 9 - contactPhone.length,
                              plural: 9 - contactPhone.length > 1 ? "s" : "",
                            })
                          : !contactPhone.startsWith("9")
                          ? t("register.phoneMustStartWith9")
                          : t("register.phoneCompleteValid")}
                      </p>
                    )}
                    {contactPhone.length === 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        {t("register.phoneExactly9Help")}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Guest Tickets Management Section (Opción B) */}
              <div className="space-y-4 p-4 rounded-2xl bg-muted/30 border border-border/60">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 text-left">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-primary" />
                      {t("register.guestsQuestion")}
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      {t("register.guestsHelp")}
                    </p>
                  </div>
                  {guests.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setRegistrationValue("guests", [...guests, { name: "", phone: "" }])}
                      className="px-2.5 py-1 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all rounded-lg select-none"
                    >
                      {t("register.addGuest")}
                    </button>
                  )}
                </div>

                {guests.length > 0 && (
                  <div className="space-y-4 pt-2 border-t border-dashed border-border/80 animate-slideDown">
                    {guests.map((guest, idx) => (
                      <div key={idx} className="relative p-3.5 rounded-xl bg-card border border-border flex flex-col gap-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            {t("register.guestNumber", { index: idx + 1 })}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const newGuests = guests.filter((_, i) => i !== idx);
                              setRegistrationValue("guests", newGuests);
                            }}
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-0.5 select-none"
                          >
                            <X className="h-3.5 w-3.5" /> {t("register.removeGuest")}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Guest Name */}
                          <div className="space-y-1 text-left">
                            <label className="text-[10px] font-bold text-foreground uppercase block">
                              {t("register.guestFullName")}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder={t("register.guestFullNamePlaceholder")}
                              value={guest.name}
                              onChange={(e) => {
                                const newGuests = [...guests];
                                newGuests[idx].name = e.target.value;
                                setRegistrationValue("guests", newGuests);
                              }}
                              className="w-full px-3 py-1.5 text-xs bg-muted/40 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground/60"
                            />
                          </div>

                          {/* Guest Phone (Optional) */}
                          <div className="space-y-1 text-left">
                            <label className="text-[10px] font-bold text-foreground uppercase block">
                              {t("register.guestPhoneOptional")}
                            </label>
                            <div className="relative flex items-center">
                              <span className="absolute left-2.5 text-xs text-muted-foreground font-medium select-none border-r border-border pr-2">
                                +51
                              </span>
                              <input
                                type="tel"
                                maxLength={9}
                                placeholder="912345678"
                                value={guest.phone}
                                onChange={(e) => {
                                  const onlyDigits = e.target.value.replace(/\D/g, "");
                                  if (onlyDigits.length <= 9) {
                                    const newGuests = [...guests];
                                    newGuests[idx].phone = onlyDigits;
                                    setRegistrationValue("guests", newGuests);
                                  }
                                }}
                                style={{ paddingLeft: "46px" }}
                                className="w-full pr-3 py-1.5 text-xs bg-muted/40 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground/60 tracking-wider"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Opción de Certificado Oficial (si el evento lo ofrece) */}
              {hasCertificate && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1 text-left">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-primary" />
                      Certificación Oficial de Participación
                    </label>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      El organizador ofrece un certificado oficial verificable con código QR único anti-fraude.
                    </p>
                  </div>

                  <div
                    onClick={() => setRegistrationValue("wantsCertificate", !wantsCertificate)}
                    className={`group cursor-pointer rounded-2xl border p-4 transition-all duration-200 text-left flex items-center justify-between gap-3 ${
                      wantsCertificate
                        ? "border-primary bg-primary/10 dark:bg-primary/20 ring-2 ring-primary shadow-sm"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {certificateTitle || "Certificado Oficial de Aprobación / Asistencia"}
                        </span>
                        {wantsCertificate && (
                          <span className="rounded-full bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider border border-primary/20">
                            Añadido
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {Number(certificatePrice) > 0
                          ? `Add-on opcional de certificación: S/ ${Number(certificatePrice).toFixed(2)}`
                          : "Incluido sin costo adicional con tu inscripción"}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2.5">
                      <span className="text-xs font-bold text-primary">
                        {Number(certificatePrice) > 0
                          ? `+ S/ ${Number(certificatePrice).toFixed(2)}`
                          : "Gratis"}
                      </span>
                      <div
                        className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                          wantsCertificate
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30 bg-background"
                        }`}
                      >
                        {wantsCertificate && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Informative Alert for payment */}
              {consolidatedTotalCost > 0 && (
                <div className="rounded-xl bg-primary/5 border border-primary/15 p-3.5 flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs text-muted-foreground text-left">
                    <p className="font-semibold text-foreground">{t("register.unifiedPaymentTitle")}</p>
                    <p className="leading-relaxed">
                      {t("register.unifiedPaymentHelp")}
                    </p>
                  </div>
                </div>
              )}

              {/* Dynamic Consolidated Breakdown */}
              <div className="border-t border-border pt-4 space-y-2.5 text-left">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  {t("register.consolidatedBreakdown")}
                </span>
                
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {hasMultipleSchedules && selectedSlot && (
                    <div className="flex justify-between items-center animate-fadeIn">
                      <span>{t("register.scheduleSlotBadge")}</span>
                      <span className="font-semibold text-primary">
                        {selectedSlot.label || "Turno Seleccionado"}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>
                      {t("register.ticketCostLabel", {
                        paidLabel: eventPrice > 0 ? t("register.paidTicket") : t("register.freeTicket"),
                        guestsSuffix: guests.length > 0 ? ` x ${1 + guests.length}` : "",
                      })}
                    </span>
                    <span className="font-medium text-foreground">
                      {eventPrice > 0
                        ? `S/ ${(eventPrice * (1 + guests.length)).toFixed(2)}`
                        : t("register.free")}
                    </span>
                  </div>

                  {effectiveWantsTransport && (
                    <div className="flex justify-between animate-fadeIn">
                      <span>
                        {t("register.transportSeatsLabel", {
                          count: seatsCount,
                          plural: seatsCount > 1 ? "s" : "",
                        })}
                      </span>
                      <span className="font-medium text-foreground">
                        {transportTotalCost > 0
                          ? `S/ ${transportTotalCost.toFixed(2)}`
                          : t("register.free")}
                      </span>
                    </div>
                  )}

                  {effectiveWantsCertificate && (
                    <div className="flex justify-between items-center animate-fadeIn">
                      <span className="flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{certificateTitle || "Certificado Oficial"}</span>
                      </span>
                      <span className="font-medium text-foreground">
                        {Number(certificatePrice) > 0
                          ? `S/ ${Number(certificatePrice).toFixed(2)}`
                          : t("register.free")}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm text-foreground font-semibold pt-2 border-t border-dashed border-border">
                    <span className="flex items-center gap-1">
                      {t("register.consolidatedTotal")}
                    </span>
                    <span className="text-primary text-base font-bold bg-primary/5 px-2.5 py-0.5 rounded-lg">
                      {consolidatedTotalCost > 0
                        ? `S/ ${consolidatedTotalCost.toFixed(2)}`
                        : t("register.free")}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-5 border-t border-border bg-muted/30 flex gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-border hover:bg-muted text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                disabled={isPending}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleRegisterSubmit}
                disabled={isPending}
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("register.confirmRegistration")
                )}
              </button>
            </div>

          </div>
        </div>,
        document.body
      );
  }
}
