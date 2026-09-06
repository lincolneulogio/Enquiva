"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  useLocale,
  useTranslations,
} from "@/components/providers/LocaleProvider";
import { usePlatformBrand } from "@/components/providers/PlatformBrandProvider";
import { getPusherClient, PUSHER_CHANNELS, PUSHER_EVENTS } from "@/lib/pusher/client";
import { buildTicketQrDataUrlClient } from "@/lib/tickets/qr-client";
import {
  TicketCardProps,
  GuestTicketItem,
  ActiveGuestQrData,
  TicketCardHeader,
  TicketQrSection,
  PaymentReceiptSection,
  TransportBookingBadge,
  GuestAttendanceTracker,
  GuestTicketsList,
  GuestQrModal,
  TicketActionsBar,
  showWalletDialog,
  downloadAllGroupTickets,
} from "./card";

export type { TicketCardProps } from "./card/types";

export function TicketCard({
  ticket,
  event,
  registration,
  paymentStatus,
  paymentReceiptUrl,
  paymentMethod,
  transportBooking,
  transportOfferFromPrice,
  guests,
  attendeeName,
  defaultExpanded = false,
  isExpanded: controlledExpanded,
  onToggle,
}: TicketCardProps) {
  const { locale } = useLocale();
  const t = useTranslations();
  const brand = usePlatformBrand();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const hasTransport = Boolean(event.hasTransport);

  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const handleToggle = onToggle || (() => setInternalExpanded(!internalExpanded));

  const [activeGuestQr, setActiveGuestQr] = useState<ActiveGuestQrData | null>(null);

  const showGuestQr = async (guest: GuestTicketItem) => {
    if (!guest.ticket?.code) return;
    const qrCode = await buildTicketQrDataUrlClient(
      guest.ticket.code,
      guest.ticket.signature,
    );
    if (!qrCode) return;
    setActiveGuestQr({
      name: guest.user.name,
      qrCode,
      code: guest.ticket.code,
    });
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
      );
      if (!cancelled) setQrDataUrl(dataUrl);
    })();
    return () => {
      cancelled = true;
    };
  }, [ticket?.code, ticket?.signature]);

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
              : "¡Tu check-in de ingreso ha sido verificado con éxito!",
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
                : g,
            ),
          );
          if (guestName) {
            toast.success(
              locale === "en"
                ? `Guest ${guestName} checked in successfully!`
                : `¡El invitado ${guestName} ingresó correctamente!`,
            );
          }
        }
      },
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
      await downloadAllGroupTickets({
        event,
        ticketCode: ticket?.code,
        ticketSignature: ticket?.signature,
        attendeeName,
        primaryStatus,
        scheduleLabel: registration.selectedScheduleLabel,
        guestsState,
        locale,
        brandName: brand.name,
      });
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleWalletInfo = (walletType: "apple" | "google") => {
    showWalletDialog(event.title, walletType, locale);
  };

  // Real-time calculated counters
  const primaryCheckedIn = primaryStatus === "checked_in" ? 1 : 0;
  const guestsCheckedIn = guestsState.filter((g) => g.registration.status === "checked_in").length;
  const totalCheckedIn = primaryCheckedIn + guestsCheckedIn;
  const totalAttendees = 1 + guestsState.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-md sm:rounded-3xl">
      {/* 1. CABECERA SIEMPRE VISIBLE */}
      <TicketCardHeader
        event={event}
        registration={registration}
        primaryStatus={primaryStatus}
        paymentStatus={paymentStatus}
        isExpanded={isExpanded}
        onToggle={handleToggle}
        locale={locale}
        t={t}
      />

      {/* 2. DETALLES EXPANDIBLES */}
      {isExpanded && (
        <div className="border-t border-dashed border-border/80 bg-background/10 p-5 sm:p-6 space-y-6 animate-in fade-in slide-in-from-top-1.5 duration-200">
          {/* GRILLA PRINCIPAL DE 2 COLUMNAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            <TicketQrSection
              ticket={ticket}
              event={event}
              registration={registration}
              qrDataUrl={qrDataUrl}
              primaryStatus={primaryStatus}
              paymentStatus={paymentStatus}
              locale={locale}
              t={t}
            />
            <PaymentReceiptSection
              registration={registration}
              paymentStatus={paymentStatus}
              paymentReceiptUrl={paymentReceiptUrl}
              paymentMethod={paymentMethod}
              locale={locale}
              t={t}
            />
          </div>

          {/* SECCIÓN DE TRANSPORTE */}
          <TransportBookingBadge
            transportBooking={transportBooking}
            hasTransport={hasTransport}
            transportOfferFromPrice={transportOfferFromPrice}
            locale={locale}
          />

          {/* REALTIME GROUP ATTENDANCE TRACKER */}
          <GuestAttendanceTracker
            totalCheckedIn={totalCheckedIn}
            totalAttendees={totalAttendees}
            locale={locale}
          />

          {/* ACCIONES INFERIORES */}
          <TicketActionsBar
            event={event}
            registration={registration}
            ticket={ticket}
            primaryStatus={primaryStatus}
            paymentStatus={paymentStatus}
            hasTransport={hasTransport}
            attendeeName={attendeeName}
            qrDataUrl={qrDataUrl}
            hasGuests={guestsState.length > 0}
            downloadingAll={downloadingAll}
            onDownloadAll={handleDownloadAll}
            onWalletInfo={handleWalletInfo}
            locale={locale}
            t={t}
          />

          {/* SECCIÓN DE ENTRADAS DE INVITADOS */}
          <GuestTicketsList
            guestsState={guestsState}
            event={event}
            primaryStatus={primaryStatus}
            paymentStatus={paymentStatus}
            locale={locale}
            onShowGuestQr={showGuestQr}
          />
        </div>
      )}

      {/* MODAL PARA CÓDIGO QR DE INVITADO */}
      <GuestQrModal
        activeGuestQr={activeGuestQr}
        onClose={() => setActiveGuestQr(null)}
        locale={locale}
      />
    </div>
  );
}
