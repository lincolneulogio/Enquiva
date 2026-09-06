"use client";

import React from "react";
import Image from "next/image";
import {
  Ticket as TicketIcon,
  Clock,
  XCircle,
  AlertTriangle,
  Download,
} from "lucide-react";
import { Ticket, Event, Registration } from "@/lib/db/schema";
import { formatEventDate, registrationStatusLabel } from "@/lib/utils";
import { toast } from "sonner";

interface TicketQrSectionProps {
  ticket?: Ticket | null;
  event: Event;
  registration: Registration;
  qrDataUrl: string | null;
  primaryStatus: string;
  paymentStatus?: string;
  locale: "es" | "en";
  t: (key: string, params?: Record<string, any>) => string;
}

export function TicketQrSection({
  ticket,
  event,
  registration,
  qrDataUrl,
  primaryStatus,
  paymentStatus,
  locale,
  t,
}: TicketQrSectionProps) {
  const handleDownloadQrImage = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `ticket-qr-${ticket?.code || event.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(
      locale === "en"
        ? "QR Code image saved to your downloads. Ready to use offline!"
        : "Código QR guardado en tus descargas. ¡Listo para presentar sin internet!",
    );
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2">
        <TicketIcon className="h-4.5 w-4.5 text-primary" />
        {locale === "en" ? "Ticket Details" : "Detalles del Ticket"}
      </h4>

      <div className="grid gap-4 rounded-2xl border border-dashed border-border bg-background/50 p-4">
        {qrDataUrl && primaryStatus !== "cancelled" ? (
          <div className="flex flex-col items-center gap-2.5">
            <div className="w-36 relative group transition duration-300">
              <Image
                src={qrDataUrl}
                alt={t("ticket.yourTicket")}
                width={200}
                height={200}
                className="mx-auto rounded-xl shadow-sm bg-white p-1"
                unoptimized
              />
            </div>
            <button
              type="button"
              onClick={handleDownloadQrImage}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 text-xs font-bold text-primary transition-all shadow-2xs cursor-pointer active:scale-95 select-none"
              title={
                locale === "en"
                  ? "Save this QR image to your phone for offline entry"
                  : "Guarda este código en tu galería para ingresar sin conexión a internet"
              }
            >
              <Download className="h-3.5 w-3.5" />
              <span>{locale === "en" ? "Save QR for Offline Use" : "Guardar QR para uso offline"}</span>
            </button>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{locale === "en" ? "Valid without internet connection" : "Válido sin conexión a internet"}</span>
            </div>
          </div>
        ) : primaryStatus === "cancelled" ? (
          <div className="flex flex-col h-36 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-semibold p-3 text-center space-y-1">
            <XCircle className="h-6 w-6 text-destructive mb-0.5" />
            <span className="uppercase tracking-wider">
              {locale === "en" ? "Ticket Cancelled" : "Entrada Cancelada"}
            </span>
            <span className="text-[10px] text-muted-foreground font-normal leading-tight">
              {locale === "en" ? "Registration was cancelled" : "La inscripción fue cancelada"}
            </span>
          </div>
        ) : paymentStatus === "rejected" ? (
          <div className="flex flex-col h-36 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive font-semibold p-3 text-center space-y-1">
            <AlertTriangle className="h-6 w-6 text-destructive mb-0.5" />
            <span className="uppercase tracking-wider">
              {locale === "en" ? "Payment Rejected" : "Pago Rechazado"}
            </span>
            <span className="text-[10px] text-muted-foreground font-normal leading-tight">
              {locale === "en"
                ? "QR will be issued upon payment approval"
                : "No se emite QR hasta aprobar el pago"}
            </span>
          </div>
        ) : paymentStatus === "pending" ? (
          <div className="flex flex-col h-36 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 font-semibold p-3 text-center space-y-1">
            <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400 mb-0.5" />
            <span className="uppercase tracking-wider">
              {locale === "en" ? "QR Pending Payment" : "QR Pendiente de Pago"}
            </span>
            <span className="text-[10px] text-muted-foreground font-normal leading-tight">
              {locale === "en"
                ? "Will be issued upon payment approval"
                : "Se emitirá al confirmarse el pago"}
            </span>
          </div>
        ) : (
          <div className="flex h-36 items-center justify-center rounded-xl bg-secondary text-xs uppercase text-muted-foreground font-semibold">
            {t("ticket.qrPending")}
          </div>
        )}

        <div className="space-y-2 text-xs text-muted-foreground border-t border-border/40 pt-3">
          <p>
            <strong className="text-foreground">
              {locale === "en" ? "Date & Time:" : "Fecha y Hora:"}
            </strong>{" "}
            {formatEventDate(event.date, locale)}
          </p>
          {registration.selectedScheduleLabel && (
            <p>
              <strong className="text-foreground">
                {locale === "en" ? "Shift / Schedule:" : "Turno / Horario:"}
              </strong>{" "}
              <span className="font-semibold text-primary">
                {registration.selectedScheduleLabel}
              </span>
            </p>
          )}
          <p>
            <strong className="text-foreground">{t("ticket.registrationStatus")}:</strong>{" "}
            <span className="font-semibold text-foreground">
              {registrationStatusLabel(primaryStatus, locale)}
            </span>
          </p>
          <p>
            <strong className="text-foreground">{t("ticket.ticketCode")}:</strong>{" "}
            <span className="font-mono font-semibold text-foreground">
              {ticket?.code ??
                (primaryStatus === "cancelled"
                  ? locale === "en"
                    ? "Cancelled (Not issued)"
                    : "Cancelado (No emitido)"
                  : paymentStatus === "rejected"
                  ? locale === "en"
                    ? "Payment rejected (Not issued)"
                    : "Pago rechazado (No emitido)"
                  : paymentStatus === "pending"
                  ? locale === "en"
                    ? "Pending payment"
                    : "Pendiente de pago"
                  : t("ticket.generating"))}
            </span>
          </p>
        </div>

        <p className="text-[10px] text-muted-foreground/80 leading-relaxed text-center mt-1 border-t border-border/30 pt-2">
          {t("ticket.secureQrHelp")}
        </p>
      </div>
    </div>
  );
}
