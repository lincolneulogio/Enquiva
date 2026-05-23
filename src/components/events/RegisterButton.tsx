"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerForEvent, cancelRegistration } from "@/actions/registrations";
import Swal from "sweetalert2";
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
  Sparkles
} from "lucide-react";
import { useTranslations } from "@/components/providers/LocaleProvider";
import Link from "next/link";
import { confirmDeleteAction } from "@/lib/ui/confirm";

interface RegisterButtonProps {
  eventId: string;
  isAuthenticated: boolean;
  isRegistrationClosed?: boolean;
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
    description: string | null;
    isActive: boolean;
  }>;
  eventPrice?: number;
  paymentStatus?: "pending" | "approved" | "rejected" | null;
}

export function RegisterButton({
  eventId,
  isAuthenticated,
  isRegistrationClosed = false,
  closedReason,
  hasTransport = false,
  currentStatus,
  registrationId,
  transportRoutes = [],
  eventPrice = 0,
  paymentStatus = null,
}: RegisterButtonProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState(currentStatus);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wantsTransport, setWantsTransport] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [seatsCount, setSeatsCount] = useState(1);
  const [contactPhone, setContactPhone] = useState("");

  // Select first route by default if routes exist
  useEffect(() => {
    if (transportRoutes.length > 0 && !selectedRouteId) {
      setSelectedRouteId(transportRoutes[0].id);
    }
  }, [transportRoutes, selectedRouteId]);

  // Lock body scroll when modal is open to hide scrollbar and prevent background scrolling
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (isModalOpen) {
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      if (typeof window !== "undefined" && (window as any).lenis) {
        (window as any).lenis.stop();
      }
    } else {
      html.style.overflow = "";
      body.style.overflow = "";
      if (typeof window !== "undefined" && (window as any).lenis) {
        (window as any).lenis.start();
      }
    }
    return () => {
      html.style.overflow = "";
      body.style.overflow = "";
      if (typeof window !== "undefined" && (window as any).lenis) {
        (window as any).lenis.start();
      }
    };
  }, [isModalOpen]);

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

  const activeRoute = transportRoutes.find((r) => r.id === selectedRouteId);
  const transportPricePerSeat = activeRoute ? Number(activeRoute.pricePerSeat) : 0;
  const transportTotalCost = wantsTransport ? transportPricePerSeat * seatsCount : 0;
  const consolidatedTotalCost = eventPrice + transportTotalCost;

  const handleRegisterSubmit = () => {
    // Basic phone validation if transport selected
    if (wantsTransport) {
      if (contactPhone.trim() === "") {
        toast.error("El teléfono de contacto es obligatorio para coordinar el transporte.");
        return;
      }
      const cleanPhone = contactPhone.replace(/\D/g, "");
      if (cleanPhone.length < 9) {
        toast.error("Por favor, ingresa un número de teléfono válido.");
        return;
      }
    }

    startTransition(async () => {
      try {
        const payload = {
          eventId,
          contactPhone: wantsTransport && contactPhone ? contactPhone : undefined,
          routeId: wantsTransport ? selectedRouteId : null,
          seats: wantsTransport ? seatsCount : null,
        };

        const result = await registerForEvent(payload);
        if (result.success) {
          setOptimisticStatus("registered");
          toast.success(wantsTransport ? "¡Inscripción y reserva de transporte registradas!" : t("register.registrationSuccess"));
          setIsModalOpen(false);

          if (result.requiresPayment && result.registrationId) {
            router.push(`/member/payments/new/${result.registrationId}`);
          } else {
            router.push(wantsTransport ? "/member/transport" : "/member/tickets");
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
      title: "¿Cancelar tu inscripción?",
      text: "¿Estás seguro de que deseas cancelar tu inscripción al evento? Esta acción liberará tu cupo y cancelará automáticamente cualquier reserva de transporte asociada.",
      confirmText: "Sí, continuar",
      cancelText: "No, mantener activa",
      tone: "danger",
    });

    if (!confirmed) return;

    // 2. Request user's password for security verification using a custom premium SweetAlert2 dialog
    const { value: password, isConfirmed } = await Swal.fire({
      title: "Verificación de Seguridad",
      text: "Ingresa tu contraseña para confirmar la cancelación de tu reserva:",
      input: "password",
      inputPlaceholder: "Contraseña",
      inputAttributes: {
        autocapitalize: "off",
        autocorrect: "off",
        required: "true",
      },
      showCancelButton: true,
      confirmButtonText: "Confirmar Cancelación",
      cancelButtonText: "Cancelar",
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
          return "¡Debes ingresar tu contraseña para continuar!";
        }
      }
    });

    if (!isConfirmed || !password) return;

    // 3. Process cancellation in transition with the server action
    startTransition(async () => {
      setOptimisticStatus("cancelled");
      try {
        const result = await cancelRegistration(registrationId!, password);
        if (result.success) {
          toast.success(t("register.registrationCancelled"));
          router.refresh();
        } else {
          throw new Error("Contraseña incorrecta.");
        }
      } catch (error) {
        setOptimisticStatus("registered");
        const errorMessage = error instanceof Error ? error.message : t("register.registrationCancelFailed");
        
        // Show premium red SweetAlert2 error dialog if password was incorrect
        await Swal.fire({
          title: "Error de Seguridad",
          text: errorMessage.includes("Contraseña") || errorMessage.includes("incorrecta")
            ? "La contraseña ingresada es incorrecta. Tu inscripción permanece activa."
            : "No se pudo procesar la cancelación. Inténtalo de nuevo.",
          icon: "error",
          confirmButtonText: "Entendido",
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

  if (optimisticStatus === "registered" || optimisticStatus === "checked_in") {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 py-3 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          {optimisticStatus === "checked_in" ? t("register.checkedIn") : t("register.youreRegistered")}
        </div>
        {optimisticStatus === "registered" && registrationId && (
          paymentStatus === "approved" ? (
            <div className="rounded-xl bg-muted/60 p-3 border border-border/80 text-center text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Inscripción confirmada y pagada</span>
              <p className="mt-0.5 text-[11px]">Si necesitas cancelar o solicitar un reembolso, por favor ponte en contacto con el organizador.</p>
            </div>
          ) : (
            <button
              onClick={handleCancelClick}
              disabled={isPending}
              className="block w-full rounded-xl border border-border py-2 text-center text-xs text-muted-foreground hover:border-destructive hover:text-destructive transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="mx-auto h-3 w-3 animate-spin" /> : t("register.cancelRegistration")}
            </button>
          )
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
          if (hasTransport && transportRoutes.length > 0) {
            setIsModalOpen(true);
          } else {
            // Register directly
            startTransition(async () => {
              try {
                const result = await registerForEvent({ eventId });
                if (result.success) {
                  setOptimisticStatus("registered");
                  toast.success(t("register.registrationSuccess"));
                  if (result.requiresPayment && result.registrationId) {
                    router.push(`/member/payments/new/${result.registrationId}`);
                  } else {
                    router.push("/member/tickets");
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
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 shadow-sm"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          t("register.registerNow")
        )}
      </button>

      {/* Unified Registration & Transport Selection Modal */}
      {isModalOpen && mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scaleUp">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base">Inscripción y Transporte</h3>
                  <p className="text-xs text-muted-foreground">Completa tu registro para el evento</p>
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
              
              {/* Transport Optional Question */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Bus className="h-4 w-4 text-primary" />
                  ¿Deseas servicio de transporte ida y vuelta? (Opcional)
                </label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ofrecemos servicio de transporte coordinado para garantizar tu traslado seguro al evento y de regreso.
                </p>
                
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setWantsTransport(true)}
                    className={`flex items-center justify-center gap-2 rounded-xl py-3 border font-medium transition-all ${
                      wantsTransport
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                        : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {wantsTransport && <Check className="h-4 w-4" />}
                    Sí, deseo transporte
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWantsTransport(false);
                      setSeatsCount(1);
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl py-3 border font-medium transition-all ${
                      !wantsTransport
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                        : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {!wantsTransport && <Check className="h-4 w-4" />}
                    No, solo la entrada
                  </button>
                </div>
              </div>

              {/* Dynamic Interactive Transport Section */}
              {wantsTransport && (
                <div className="space-y-5 p-4 rounded-2xl bg-muted/40 border border-border/80 animate-slideDown">
                  
                  {/* Route Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                      Seleccionar Ruta de salida y retorno disponible:
                    </label>
                    <div className="grid gap-3 pt-1">
                      {transportRoutes.map((route) => (
                        <div
                          key={route.id}
                          onClick={() => setSelectedRouteId(route.id)}
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
                              S/ {Number(route.pricePerSeat).toFixed(2)} por asiento
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1.5 border-t border-border/40">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="truncate"><strong>Partida:</strong> {route.departurePoint}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span><strong>Salida:</strong> {formatRouteTime(route.departureTime)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contact Phone (Optional but highly recommended) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                      Teléfono de contacto para el bus <span className="text-rose-500 font-bold">* (Obligatorio)</span>:
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej. +51912345678"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground placeholder:text-muted-foreground"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      * El número debe seguir el formato nacional o internacional (ej. +51912345678).
                    </p>
                  </div>
                </div>
              )}

              {/* Informative Alert for payment */}
              {consolidatedTotalCost > 0 && (
                <div className="rounded-xl bg-blue-500/5 border border-blue-500/10 p-3.5 flex items-start gap-2.5">
                  <Info className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs text-blue-800 dark:text-blue-300">
                    <p className="font-semibold text-blue-700 dark:text-blue-400">Pago unificado disponible</p>
                    <p className="leading-relaxed">
                      El monto de la entrada y el pasaje de transporte se sumarán en un único pago consolidado. Solo tendrás que transferir y adjuntar un único comprobante de pago.
                    </p>
                  </div>
                </div>
              )}

              {/* Dynamic Consolidated Breakdown */}
              <div className="border-t border-border pt-4 space-y-2.5">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Desglose de Pago Consolidado:
                </span>
                
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Costo de Entrada ({eventPrice > 0 ? "De Pago" : "Gratuito"}):</span>
                    <span className="font-medium text-foreground">
                      {eventPrice > 0 ? `S/ ${eventPrice.toFixed(2)}` : "Gratis"}
                    </span>
                  </div>

                  {wantsTransport && (
                    <div className="flex justify-between animate-fadeIn">
                      <span>Transporte ({seatsCount} asiento{seatsCount > 1 ? "s" : ""}):</span>
                      <span className="font-medium text-foreground">
                        {transportTotalCost > 0 ? `S/ ${transportTotalCost.toFixed(2)}` : "Gratis"}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm text-foreground font-semibold pt-2 border-t border-dashed border-border">
                    <span className="flex items-center gap-1">
                      Total Consolidado a Pagar:
                    </span>
                    <span className="text-primary text-base font-bold bg-primary/5 px-2.5 py-0.5 rounded-lg">
                      {consolidatedTotalCost > 0 ? `S/ ${consolidatedTotalCost.toFixed(2)}` : "Gratis"}
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
                Cancelar
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
                  "Confirmar Registro"
                )}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
