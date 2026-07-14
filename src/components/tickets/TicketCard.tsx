"use client";

import Link from "next/link";
import Image from "next/image";
import { Ticket, Event, Registration } from "@/lib/db/schema";
import { formatEventDate, registrationStatusLabel } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import {
  useLocale,
  useTranslations,
} from "@/components/providers/LocaleProvider";
import { usePlatformBrand } from "@/components/providers/PlatformBrandProvider";
import { useState, useEffect } from "react";
import { getPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher/client";
import Swal from "@/lib/ui/swal-client";
import { toast } from "sonner";
import { paymentCheckoutPath } from "@/lib/navigation/attendee-paths";
import {
  Ticket as TicketIcon,
  Coins,
  Eye,
  RefreshCw,
  Wallet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Bus,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  AlertTriangle,
  Download,
  MessageSquare,
  Share2
} from "lucide-react";
import { DownloadTicketButton } from "./DownloadTicketButton";
import { CalendarSyncButtons } from "./CalendarSyncButtons";
import { buildTicketQrDataUrlClient } from "@/lib/tickets/qr-client";
import {
  createTicketPdfDoc,
  drawOfficialTicketPage,
  getActiveTicketPrimaryRgb,
  loadBrandLogoDataUrl,
} from "@/lib/tickets/render-ticket-pdf";

interface TicketCardProps {
  ticket?: Ticket | null;
  event: Event;
  registration: Registration;
  paymentStatus?: string;
  paymentReceiptUrl?: string | null;
  paymentMethod?: string | null;
  transportBooking?: {
    booking: {
      id: string;
      seats: number;
      status: string;
      notes: string | null;
      bookedAt: Date;
    };
    route: {
      name: string;
      departurePoint: string;
      departureTime: Date;
      returnTime: Date | null;
      pricePerSeat: string;
    };
    stop: {
      name: string;
      latitude: string | null;
      longitude: string | null;
    } | null;
  } | null;
  guests?: Array<{
    registration: Registration;
    ticket: Ticket | null;
    user: {
      name: string;
      email: string;
      phone: string | null;
    };
  }>;
  attendeeName?: string | null;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function TicketCard({
  ticket,
  event,
  registration,
  paymentStatus,
  paymentReceiptUrl,
  paymentMethod,
  transportBooking,
  guests,
  attendeeName,
  defaultExpanded = false,
  isExpanded: controlledExpanded,
  onToggle,
}: TicketCardProps) {
  const { locale } = useLocale();
  const t = useTranslations();
  const brand = usePlatformBrand();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(ticket?.qrCode ?? null);
  const hasTransport = Boolean(event.hasTransport);
  
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const handleToggle = onToggle || (() => setInternalExpanded(!internalExpanded));

  const [activeGuestQr, setActiveGuestQr] = useState<{
    name: string;
    qrCode: string;
    code: string;
  } | null>(null);

  const showGuestQr = async (guest: NonNullable<typeof guests>[number]) => {
    if (!guest.ticket?.code) return;
    const qrCode = await buildTicketQrDataUrlClient(
      guest.ticket.code,
      guest.ticket.signature,
      guest.ticket.qrCode,
    );
    if (!qrCode) return;
    setActiveGuestQr({
      name: guest.user.name,
      qrCode,
      code: guest.ticket.code,
    });
  };

  const guestTicketShareUrl = (code: string, signature?: string | null) => {
    const appUrl =
      (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "") ||
      (typeof window !== "undefined" ? window.location.origin : "");
    return signature
      ? `${appUrl}/ticket/${code}?s=${signature}`
      : `${appUrl}/ticket/${code}`;
  };

  // --- PREMIUM REALTIME CHECK-IN TRACKER (PUSHER) ---
  const [primaryStatus, setPrimaryStatus] = useState(registration.status);
  const [guestsState, setGuestsState] = useState(guests || []);

  useEffect(() => {
    setPrimaryStatus(registration.status);
  }, [registration.status]);

  useEffect(() => {
    setGuestsState(guests || []);
  }, [guests]);

  useEffect(() => {
    let cancelled = false;
    if (!ticket?.code) {
      setQrDataUrl(null);
      return;
    }
    void (async () => {
      const dataUrl = await buildTicketQrDataUrlClient(
        ticket.code,
        ticket.signature,
        ticket.qrCode,
      );
      if (!cancelled) setQrDataUrl(dataUrl);
    })();
    return () => {
      cancelled = true;
    };
  }, [ticket?.code, ticket?.signature, ticket?.qrCode]);

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(PUSHER_CHANNELS.event(event.id));

    channel.bind(
      PUSHER_EVENTS.checkIn,
      (data: { registrationId: string; userId: string; checkedInAt: string }) => {
        if (data.registrationId === registration.id) {
          setPrimaryStatus("checked_in");
          toast.success(
            locale === "en"
              ? "Your entrance check-in was successfully verified!"
              : "¡Tu check-in de ingreso ha sido verificado con éxito!"
          );
        } else {
          const guestName =
            guestsState.find((g) => g.registration.id === data.registrationId)?.user.name || "";
          setGuestsState((prev) =>
            prev.map((g) =>
              g.registration.id === data.registrationId
                ? {
                    ...g,
                    registration: {
                      ...g.registration,
                      status: "checked_in",
                      checkedInAt: new Date(data.checkedInAt),
                    },
                  }
                : g
            )
          );
          if (guestName) {
            toast.success(
              locale === "en"
                ? `Guest ${guestName} checked in successfully!`
                : `¡El invitado ${guestName} ingresó correctamente!`
            );
          }
        }
      }
    );

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(PUSHER_CHANNELS.event(event.id));
    };
  }, [event.id, registration.id, locale, guestsState]);

  // --- MULTIPAGE CONSOLIDATED PDF DOWNLOAD ---
  const [downloadingAll, setDownloadingAll] = useState(false);

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    try {
      const [{ jsPDF }, logoDataUrl] = await Promise.all([
        import("jspdf"),
        loadBrandLogoDataUrl(),
      ]);
      const doc = createTicketPdfDoc(jsPDF);
      const theme = {
        primary: getActiveTicketPrimaryRgb(),
        logoDataUrl,
        brandName: brand.name,
      };

      const ticketsToGenerate = (
        await Promise.all([
          ticket?.code
            ? buildTicketQrDataUrlClient(ticket.code, ticket.signature, ticket.qrCode).then((qrCode) =>
                qrCode
                  ? {
                      code: ticket.code,
                      attendeeName: attendeeName || "",
                      qrCode,
                      status: primaryStatus,
                    }
                  : null,
              )
            : Promise.resolve(null),
          ...guestsState.map((g) =>
            g.ticket?.code
              ? buildTicketQrDataUrlClient(
                  g.ticket.code,
                  g.ticket.signature,
                  g.ticket.qrCode,
                ).then((qrCode) =>
                  qrCode
                    ? {
                        code: g.ticket!.code,
                        attendeeName: g.user.name,
                        qrCode,
                        status: g.registration.status,
                      }
                    : null,
                )
              : Promise.resolve(null),
          ),
        ])
      ).filter((t): t is NonNullable<typeof t> => t != null);

      if (ticketsToGenerate.length === 0) {
        toast.error(
          locale === "en"
            ? "No tickets are ready for download yet."
            : "No hay entradas listas para descargar todavía."
        );
        return;
      }

      const locationText = event.isVirtual
        ? locale === "en"
          ? "Virtual Event"
          : "Evento Virtual"
        : event.location ||
          (locale === "en" ? "To be confirmed" : "Por confirmar");
      const formattedDate = formatEventDate(event.date, locale);
      const ticketLocale = locale === "en" ? "en" : "es";

      for (let i = 0; i < ticketsToGenerate.length; i++) {
        if (i > 0) {
          doc.addPage([320, 520], "portrait");
        }

        const tInfo = ticketsToGenerate[i];
        const statusStr =
          tInfo.status === "checked_in"
            ? locale === "en"
              ? "Checked In"
              : "Ingresó"
            : locale === "en"
              ? "Active / Registered"
              : "Activo / Registrado";

        drawOfficialTicketPage(
          doc,
          {
            eventTitle: event.title,
            eventDateLabel: formattedDate,
            locationLabel: locationText,
            attendeeName: tInfo.attendeeName,
            statusLabel: statusStr,
            ticketCode: tInfo.code,
            qrDataUrl: tInfo.qrCode,
            locale: ticketLocale,
          },
          theme,
        );
      }

      const fileName = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-todas-las-entradas.pdf`;
      doc.save(fileName);
      toast.success(
        locale === "en"
          ? "All group tickets compiled and downloaded as a single PDF!"
          : "¡Todas las entradas de tu grupo compiladas en un solo PDF!"
      );
    } catch (err) {
      console.error(err);
      toast.error(
        locale === "en"
          ? "Failed to download group tickets. Try again."
          : "Fallo al compilar y descargar las entradas de tu grupo."
      );
    } finally {
      setDownloadingAll(false);
    }
  };

  // --- PREMIUM GOOGLE & APPLE WALLET DIALOGS ---
  const handleWalletInfo = (walletType: "apple" | "google") => {
    const isApple = walletType === "apple";
    Swal.fire({
      title: isApple ? "Apple Wallet" : "Google Wallet",
      html: `
        <div class="text-left space-y-3 mt-2 text-sm leading-relaxed font-sans text-foreground">
          <p>
            ¡Tus tickets oficiales del <strong>${event.title}</strong> son 100% compatibles con lectores digitales! Para agregarlos de forma rápida a tu billetera:
          </p>
          <ol class="list-decimal pl-5 space-y-2 text-xs text-muted-foreground">
            <li>Haz una captura de pantalla del código QR individual de tu entrada o de tus invitados.</li>
            <li>Abre la aplicación <strong>${isApple ? "Apple Wallet" : "Google Wallet"}</strong> en tu celular.</li>
            <li>Selecciona la opción <strong>"Agregar un pase"</strong> o <strong>"Escanear foto de pase"</strong> y escoge la captura en tu galería de fotos.</li>
          </ol>
          <div class="rounded-xl bg-primary/10 border border-primary/20 p-3 mt-3 text-xs text-center font-semibold text-primary flex items-center justify-center gap-1.5">
            <svg class="h-3.5 w-3.5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <span>El código QR de ingreso contiene cifrado dinámico y es único por asistente.</span>
          </div>
        </div>
      `,
      icon: "info",
      confirmButtonText: locale === "en" ? "Got it" : "Entendido",
      buttonsStyling: false,
      customClass: {
        popup: "fe-swal-popup rounded-3xl border border-border bg-card text-foreground",
        title: "fe-swal-title text-primary font-bold text-lg",
        htmlContainer: "fe-swal-text",
        actions: "fe-swal-actions mt-4",
        confirmButton: "fe-swal-confirm w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/95 text-white font-semibold text-sm transition-colors cursor-pointer text-center",
      }
    });
  };

  // Real-time calculated counters
  const primaryCheckedIn = primaryStatus === "checked_in" ? 1 : 0;
  const guestsCheckedIn = guestsState.filter((g) => g.registration.status === "checked_in").length;
  const totalCheckedIn = primaryCheckedIn + guestsCheckedIn;
  const totalAttendees = 1 + guestsState.length;

  return (
    <div className="rounded-3xl border border-border bg-card shadow-3xs overflow-hidden hover:shadow-2xs transition-all duration-300">
      {/* 1. CABECERA SIEMPRE VISIBLE */}
      <div
        onClick={handleToggle}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 cursor-pointer hover:bg-muted/10 transition-colors select-none"
      >
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-2.5 shrink-0 hidden sm:block">
            <TicketIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
              {t("ticket.yourTicket")}
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold text-foreground mt-0.5 leading-snug truncate">
              {event.title}
            </h3>
            <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-xs text-muted-foreground mt-1.5 leading-none">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                <span>{formatEventDate(event.date, locale)}</span>
              </span>
              {event.location && (
                <span className="flex items-center gap-1.5 truncate">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Statuses and Toggle Arrow */}
        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
          <div className="flex items-center gap-2">
            {paymentStatus && <PaymentStatusBadge status={paymentStatus} />}
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              primaryStatus === "registered" || primaryStatus === "checked_in"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50"
                : primaryStatus === "waitlisted"
                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50"
                : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50"
            }`}>
              {registrationStatusLabel(primaryStatus, locale)}
            </span>
          </div>
          
          <div className="rounded-xl border border-border bg-background p-1.5 hover:bg-secondary transition text-muted-foreground hover:text-foreground">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </div>

      {/* 2. DETALLES EXPANDIBLES */}
      {isExpanded && (
        <div className="border-t border-dashed border-border/80 bg-background/10 p-5 sm:p-6 space-y-6 animate-in fade-in slide-in-from-top-1.5 duration-200">
          {/* GRILLA PRINCIPAL DE 2 COLUMNAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            
            {/* COLUMNA IZQUIERDA: Detalles de Entrada & QR */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2">
                <TicketIcon className="h-4.5 w-4.5 text-primary" />
                {locale === "en" ? "Ticket Details" : "Detalles del Ticket"}
              </h4>

              <div className="grid gap-4 rounded-2xl border border-dashed border-border bg-background/50 p-4">
                {qrDataUrl ? (
                  <div className="mx-auto w-36 relative group transition duration-300">
                    <Image
                      src={qrDataUrl}
                      alt={t("ticket.yourTicket")}
                      width={200}
                      height={200}
                      className="mx-auto rounded-xl shadow-sm bg-white p-1"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-36 items-center justify-center rounded-xl bg-secondary text-xs uppercase text-muted-foreground font-semibold">
                    {t("ticket.qrPending")}
                  </div>
                )}
                
                <div className="space-y-2 text-xs text-muted-foreground border-t border-border/40 pt-3">
                  <p>
                    <strong className="text-foreground">{locale === "en" ? "Date & Time:" : "Fecha y Hora:"}</strong> {formatEventDate(event.date, locale)}
                  </p>
                  <p>
                    <strong className="text-foreground">{t("ticket.registrationStatus")}:</strong>{" "}
                    <span className="font-semibold text-foreground">
                      {registrationStatusLabel(primaryStatus, locale)}
                    </span>
                  </p>
                  <p>
                    <strong className="text-foreground">{t("ticket.ticketCode")}:</strong>{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {ticket?.code ?? t("ticket.generating")}
                    </span>
                  </p>
                </div>
                
                <p className="text-[10px] text-muted-foreground/80 leading-relaxed text-center mt-1 border-t border-border/30 pt-2">
                  {t("ticket.secureQrHelp")}
                </p>
              </div>
            </div>

            {/* COLUMNA DERECHA: Estado de Pago & Vista Previa */}
            <div className="space-y-4 md:border-l md:border-border md:pl-6 lg:pl-8">
              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2">
                <Coins className="h-4.5 w-4.5 text-primary" />
                {locale === "en" ? "Payment & Receipt" : "Estado Financiero y Comprobante"}
              </h4>

              {/* CASO 1: Pago Pendiente con Comprobante Subido */}
              {paymentStatus === "pending" && paymentReceiptUrl && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                    <p className="font-semibold text-amber-800 dark:text-amber-400 text-sm flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      {t("ticket.verificationPending")}
                    </p>
                    <p className="text-xs text-muted-foreground leading-normal">
                      {t("ticket.verificationPendingHelp")}
                    </p>
                  </div>

                  {/* Vista Previa del Comprobante */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground block">
                      {locale === "en" ? "Preview of submitted receipt:" : "Vista previa del comprobante cargado:"}
                    </span>
                    <div className="relative group rounded-2xl overflow-hidden border border-border bg-muted/30 aspect-[4/3] flex items-center justify-center max-w-sm shadow-sm">
                      <Image
                        src={paymentReceiptUrl}
                        alt="Vista previa comprobante"
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                      />
                      {/* Hover action layer for desktop */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center gap-2">
                        <a
                          href={paymentReceiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-background/95 hover:bg-background text-foreground px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {locale === "en" ? "View Large" : "Ver Grande"}
                        </a>
                        <Link
                          href={paymentCheckoutPath(registration.id)}
                          className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          {locale === "en" ? "Change Payment" : "Cambiar Pago"}
                        </Link>
                      </div>
                    </div>
                    
                    {/* Always visible buttons for mobile/touch screens */}
                    <div className="flex md:hidden items-center gap-2">
                      <a
                        href={paymentReceiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 rounded-xl border border-border bg-background hover:bg-secondary text-foreground px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {locale === "en" ? "View Large" : "Ver Grande"}
                      </a>
                      <Link
                        href={paymentCheckoutPath(registration.id)}
                        className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        {locale === "en" ? "Change Payment" : "Cambiar Pago"}
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* CASO 2: Pago Pendiente en Efectivo */}
              {paymentStatus === "pending" && !paymentReceiptUrl && paymentMethod === "cash" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <Wallet className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-semibold text-indigo-800 dark:text-indigo-400 text-sm">
                          {t("ticket.cashPaymentTitle")}
                        </p>
                        <p className="text-xs text-muted-foreground leading-normal">
                          {t("ticket.cashPaymentHelp")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={paymentCheckoutPath(registration.id)}
                    className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition active:scale-[0.98]"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {t("ticket.changePaymentMethod")}
                  </Link>
                </div>
              )}

              {/* CASO 3: Pago Pendiente Sin Comprobante */}
              {paymentStatus === "pending" && !paymentReceiptUrl && paymentMethod !== "cash" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-amber-200/50 bg-amber-500/5 p-4 space-y-2 animate-pulse">
                    <p className="font-semibold text-amber-800 dark:text-amber-400 text-sm">
                      {t("ticket.pendingPayment")}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t("ticket.pendingPaymentHelp")}
                    </p>
                  </div>
                  
                  <Link
                    href={paymentCheckoutPath(registration.id)}
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm transition active:scale-[0.98]"
                  >
                    <Coins className="h-4 w-4" />
                    {t("ticket.payOrUploadReceipt")}
                  </Link>
                </div>
              )}

              {/* CASO 4: Pago Aprobado */}
              {paymentStatus === "approved" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 space-y-2">
                    <p className="font-semibold text-green-800 dark:text-green-400 text-sm flex items-center gap-1.5">
                      <CheckCircle2 className="h-4.5 w-4.5 text-green-500" />
                      {locale === "en" ? "Payment Confirmed & Verified" : "Pago Confirmado y Validado"}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {locale === "en" 
                        ? "The organizer has successfully verified your payment. Everything is ready for your attendance. Enjoy the event!" 
                        : "El organizador ha verificado tu pago correctamente. Todo se encuentra en orden para tu asistencia. ¡Disfruta el evento!"}
                    </p>
                  </div>

                  {paymentReceiptUrl && (
                    <div className="rounded-xl border border-border bg-muted/10 p-3 flex items-center justify-between gap-3 max-w-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4.5 w-4.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground truncate">
                          {locale === "en" ? "Archived receipt" : "Comprobante archivado"}
                        </span>
                      </div>
                      <a
                        href={paymentReceiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        {locale === "en" ? "View receipt" : "Ver comprobante"}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* CASO 5: Pago Rechazado */}
              {paymentStatus === "rejected" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
                    <p className="font-semibold text-red-800 dark:text-red-400 text-sm flex items-center gap-1.5">
                      <AlertCircle className="h-4.5 w-4.5 text-red-500" />
                      {locale === "en" ? "Payment Rejected" : "Pago Rechazado"}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {locale === "en"
                        ? "There was an issue with the submitted proof of payment. Please verify the document and upload it again."
                        : "Hubo un inconveniente con el comprobante de pago enviado. Por favor, verifica el documento y vuelve a cargarlo para revisión."}
                    </p>
                  </div>

                  <Link
                    href={paymentCheckoutPath(registration.id)}
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm transition active:scale-[0.98]"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {locale === "en" ? "Upload New Receipt" : "Subir Nuevo Comprobante"}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* 2.5 SECCIÓN DE TRANSPORTE */}
          {transportBooking && (
            <div className="rounded-2xl border border-blue-500/20 bg-blue-50/5 p-4 md:p-5 space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-blue-500/10 pb-3">
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Bus className="h-4.5 w-4.5 text-blue-500" />
                  {locale === "en" ? "Transport Service" : "Servicio de Transporte"}
                </h4>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  transportBooking.booking.status === "confirmed"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                }`}>
                  {transportBooking.booking.status === "confirmed"
                    ? (locale === "en" ? "Confirmed" : "Confirmado")
                    : (locale === "en" ? "Pending Approval" : "Reserva Pendiente")}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground font-semibold">{locale === "en" ? "Route / Bus" : "Ruta / Autobús"}</p>
                  <p className="font-bold text-foreground text-sm mt-0.5">{transportBooking.route.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">{locale === "en" ? "Departure point & Time" : "Punto de partida y Hora"}</p>
                  <p className="font-bold text-foreground text-sm mt-0.5">{transportBooking.stop?.name ?? transportBooking.route.departurePoint}</p>
                  <p className="text-muted-foreground mt-0.5">
                    {new Date(transportBooking.route.departureTime).toLocaleString(locale === "es" ? "es-PE" : "en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">{locale === "en" ? "Seats / Amount" : "Asientos / Pago"}</p>
                  <p className="font-bold text-foreground text-sm mt-0.5">
                    {transportBooking.booking.seats} {transportBooking.booking.seats > 1 ? (locale === "en" ? "seats" : "asientos") : (locale === "en" ? "seat" : "asiento")}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    S/. {(Number(transportBooking.route.pricePerSeat) * transportBooking.booking.seats).toFixed(2)} ({locale === "en" ? "Total" : "Total"})
                  </p>
                </div>
              </div>

              {transportBooking.booking.status === "pending" && (
                <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3 text-[11px] text-amber-800 dark:text-amber-300">
                  <span className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>{locale === "en" ? "Payment Verification Required" : "Verificación de Pago Requerida"}</span>
                  </span>
                  <p className="mt-0.5 leading-normal">
                    {locale === "en"
                      ? "Your transport booking is registered but is pending administrator payment verification. Click 'Manage Transport' to complete/upload proof."
                      : "Tu reserva está registrada pero falta la aprobación del pago por el administrador. Da clic en 'Gestionar Transporte' para completarlo."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* REALTIME GROUP ATTENDANCE TRACKER */}
          {guestsState.length > 0 && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4.5 space-y-3 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  {locale === "en" ? "Group Check-In Tracker (Live)" : "Ingreso del Grupo en Tiempo Real"}
                </span>
                <span className="bg-primary/10 border border-primary/25 px-2.5 py-0.5 rounded-full text-[10px]">
                  {totalCheckedIn} / {totalAttendees} {locale === "en" ? "Checked In" : "Ingresados"}
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="h-1.5 w-full bg-secondary dark:bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 rounded-full" 
                  style={{ width: `${(totalCheckedIn / totalAttendees) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* 3. ACCIONES INFERIORES */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border/85 text-sm">
            <Link
              href="/member/tickets"
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground hover:bg-secondary transition select-none"
            >
              {t("ticket.viewAllTickets")}
            </Link>

            {/* Only show premium actions when payment is approved (or no payment required) */}
            {(paymentStatus === "approved" || !paymentStatus) && (
              <>
                <Link
                  href={hasTransport ? "/member/transport" : "/member/payments"}
                  className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary/90 transition select-none"
                >
                  {hasTransport
                    ? t("ticket.manageTransport")
                    : t("ticket.paymentSummary")}
                </Link>
                {ticket && (
                  <DownloadTicketButton
                    ticketCode={ticket.code}
                    eventTitle={event.title}
                    eventDate={event.date}
                    eventLocation={event.location}
                    isVirtual={event.isVirtual}
                    attendeeName={attendeeName || null}
                    qrCode={qrDataUrl}
                    registrationStatus={registration.status}
                    className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground hover:bg-secondary transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 select-none"
                  />
                )}
                {ticket && guestsState.length > 0 && (
                  <button
                    type="button"
                    disabled={downloadingAll}
                    onClick={handleDownloadAll}
                    className="rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 select-none whitespace-nowrap"
                  >
                    <Download className="h-4 w-4 shrink-0 text-primary" />
                    <span>
                      {downloadingAll 
                        ? (locale === "en" ? "Compiling..." : "Compilando...") 
                        : (locale === "en" ? "Download Group PDFs" : "Descargar Todo (PDF)")}
                    </span>
                  </button>
                )}
                <CalendarSyncButtons
                  event={{
                    id: event.id,
                    title: event.title,
                    description: event.description,
                    date: event.date,
                    location: event.location,
                    isVirtual: event.isVirtual,
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleWalletInfo("apple")}
                  className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground hover:bg-secondary transition flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap"
                >
                  <Wallet className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Apple Wallet</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleWalletInfo("google")}
                  className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground hover:bg-secondary transition flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap"
                >
                  <Wallet className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Google Wallet</span>
                </button>
                <ResendButton registrationId={registration.id} />
              </>
            )}
          </div>

          {/* SECCIÓN DE ENTRADAS DE INVITADOS */}
          {guestsState.length > 0 && (
            <div className="rounded-2xl border border-border bg-muted/20 p-4 md:p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <TicketIcon className="h-4.5 w-4.5 text-primary" />
                  {locale === "en" ? "Guest Tickets" : "Entradas de mis Invitados"}
                </h4>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full">
                  {guestsState.length} {guestsState.length === 1 ? (locale === "en" ? "guest" : "invitado") : (locale === "en" ? "guests" : "invitados")}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {guestsState.map((guest) => {
                  const guestHasQr = Boolean(
                    guest.ticket?.code && (guest.ticket.signature || guest.ticket.qrCode),
                  );
                  const isCheckedIn = guest.registration.status === "checked_in";
                  
                  return (
                    <div 
                      key={guest.registration.id}
                      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 p-4 rounded-xl border transition-all duration-300 ${
                        isCheckedIn
                          ? "border-emerald-500/35 bg-emerald-500/5 shadow-2xs"
                          : "border-border bg-card shadow-3xs hover:border-border/80"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-extrabold text-sm text-foreground truncate">
                          {guest.user.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          {guest.ticket?.code && (
                            <span className="font-mono text-[11px] bg-secondary px-1.5 py-0.5 rounded">
                              {guest.ticket.code}
                            </span>
                          )}
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            isCheckedIn
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/50"
                              : guest.registration.status === "registered"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50"
                              : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50"
                          }`}>
                            {registrationStatusLabel(guest.registration.status, locale)}
                          </span>
                        </div>
                      </div>

                      {/* Acciones de Invitado */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {paymentStatus === "approved" && guestHasQr ? (
                          <>
                            <button
                              type="button"
                              onClick={() => showGuestQr(guest)}
                              className="rounded-xl border border-border hover:bg-secondary text-foreground px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-3xs transition duration-200 cursor-pointer select-none"
                            >
                              <Eye className="h-3.5 w-3.5 text-primary" />
                              <span>{locale === "en" ? "View QR" : "Ver QR"}</span>
                            </button>

                            <a
                              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                                locale === "en"
                                  ? `Hi ${guest.user.name}! Here is your entry ticket for the event *${event.title}*: ${guestTicketShareUrl(guest.ticket!.code, guest.ticket!.signature)} . See you there!`
                                  : `¡Hola ${guest.user.name}! Aquí tienes tu entrada para el evento *${event.title}*: ${guestTicketShareUrl(guest.ticket!.code, guest.ticket!.signature)} . ¡Nos vemos allá!`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-3xs transition duration-200 cursor-pointer select-none"
                            >
                              <Share2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>{locale === "en" ? "Share" : "Compartir"}</span>
                            </a>

                            <DownloadTicketButton
                              ticketCode={guest.ticket?.code || ""}
                              eventTitle={event.title}
                              eventDate={event.date}
                              eventLocation={event.location}
                              isVirtual={event.isVirtual}
                              attendeeName={guest.user.name}
                              ticketSignature={guest.ticket?.signature}
                              registrationStatus={guest.registration.status}
                              className="rounded-xl border border-border bg-background hover:bg-secondary text-foreground px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-3xs transition duration-200 cursor-pointer select-none"
                            />
                          </>
                        ) : !paymentStatus && guestHasQr ? (
                          <>
                            <button
                              type="button"
                              onClick={() => showGuestQr(guest)}
                              className="rounded-xl border border-border hover:bg-secondary text-foreground px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-3xs transition duration-200 cursor-pointer select-none"
                            >
                              <Eye className="h-3.5 w-3.5 text-primary" />
                              <span>{locale === "en" ? "View QR" : "Ver QR"}</span>
                            </button>

                            <a
                              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                                locale === "en"
                                  ? `Hi ${guest.user.name}! Here is your entry ticket for the event *${event.title}*: ${guestTicketShareUrl(guest.ticket!.code, guest.ticket!.signature)} . See you there!`
                                  : `¡Hola ${guest.user.name}! Aquí tienes tu entrada para el evento *${event.title}*: ${guestTicketShareUrl(guest.ticket!.code, guest.ticket!.signature)} . ¡Nos vemos allá!`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-3xs transition duration-200 cursor-pointer select-none"
                            >
                              <Share2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>{locale === "en" ? "Share" : "Compartir"}</span>
                            </a>

                            <DownloadTicketButton
                              ticketCode={guest.ticket?.code || ""}
                              eventTitle={event.title}
                              eventDate={event.date}
                              eventLocation={event.location}
                              isVirtual={event.isVirtual}
                              attendeeName={guest.user.name}
                              ticketSignature={guest.ticket?.signature}
                              registrationStatus={guest.registration.status}
                              className="rounded-xl border border-border bg-background hover:bg-secondary text-foreground px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-3xs transition duration-200 cursor-pointer select-none"
                            />
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 italic">
                            {locale === "en" ? "QR pending payment" : "QR pendiente de pago"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* PREMIUM INLINE MODAL FOR GUEST QR CODE */}
      {activeGuestQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in">
          <div className="relative w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in scale-in-95 duration-200 text-center">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/40 text-left">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <TicketIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground text-sm leading-snug">
                    {locale === "en" ? "Guest Ticket QR" : "Código QR del Invitado"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[200px]" title={activeGuestQr.name}>
                    {activeGuestQr.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveGuestQr(null)}
                className="h-8 w-8 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* QR Code and Instructions */}
            <div className="p-6 flex flex-col items-center justify-center">
              <div className="rounded-2xl border border-primary/10 bg-white p-4.5 shadow-xs transition-all">
                <img
                  src={activeGuestQr.qrCode}
                  alt={`QR de ${activeGuestQr.name}`}
                  className="h-44 w-44 rounded-xl object-contain bg-white p-1"
                />
              </div>
              <p className="mt-3.5 text-[10px] font-extrabold uppercase tracking-wider text-primary/75">
                {locale === "en" ? "Scan at the entrance" : "Escanea en el ingreso"}
              </p>
              
              <div className="mt-4.5 space-y-1">
                <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                  {locale === "en" ? "Ticket Code:" : "Código de Entrada:"}
                </span>
                <p className="text-sm font-mono font-extrabold text-foreground tracking-wide select-all bg-secondary px-3 py-1 rounded-xl">
                  {activeGuestQr.code}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/20">
              <button
                type="button"
                onClick={() => setActiveGuestQr(null)}
                className="w-full py-2 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-extrabold uppercase tracking-wider shadow-sm transition duration-250 cursor-pointer select-none"
              >
                {locale === "en" ? "Close" : "Cerrar"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function ResendButton({ registrationId }: { registrationId: string }) {
  const [loading, setLoading] = useState(false);
  const t = useTranslations();

  async function resend() {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets/resend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ registrationId }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(t("ticket.resendSuccess"));
    } catch (err) {
      console.error(err);
      toast.error(t("ticket.resendError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={resend}
      disabled={loading}
      className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground hover:bg-secondary transition disabled:opacity-50 cursor-pointer"
    >
      {loading ? t("ticket.sending") : t("ticket.resend")}
    </button>
  );
}
