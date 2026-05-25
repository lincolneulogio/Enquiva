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
import { useState } from "react";
import {
  Ticket as TicketIcon,
  Coins,
  Eye,
  RefreshCw,
  Wallet,
  CheckCircle2,
  AlertCircle,
  FileText
} from "lucide-react";

interface TicketCardProps {
  ticket?: Ticket | null;
  event: Event;
  registration: Registration;
  paymentStatus?: string;
  paymentReceiptUrl?: string | null;
  paymentMethod?: string | null;
}

export function TicketCard({
  ticket,
  event,
  registration,
  paymentStatus,
  paymentReceiptUrl,
  paymentMethod,
}: TicketCardProps) {
  const { locale } = useLocale();
  const t = useTranslations();
  const qr = ticket?.qrCode;
  const hasTransport = Boolean(event.hasTransport);

  return (
    <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
      {/* 1. CABECERA UNIFICADA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("ticket.yourTicket")}
          </p>
          <h3 className="text-xl font-bold text-foreground mt-1">
            {event.title}
          </h3>
        </div>
        {paymentStatus && <PaymentStatusBadge status={paymentStatus} />}
      </div>

      {/* 2. GRILLA PRINCIPAL DE 2 COLUMNAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        
        {/* COLUMNA IZQUIERDA: Detalles de Entrada & QR */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 border-b border-border/30 pb-2">
            <TicketIcon className="h-4.5 w-4.5 text-primary" />
            {locale === "en" ? "Ticket Details" : "Detalles del Ticket"}
          </h4>

          <div className="grid gap-4 rounded-2xl border border-dashed border-border bg-background/50 p-4">
            {qr ? (
              <div className="mx-auto w-36 relative group transition duration-300">
                <Image
                  src={qr}
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
                  {registrationStatusLabel(registration.status, locale)}
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

          {/* CASO 1: Pago Pendiente con Comprobante Subido (En Verificación) */}
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
                      href={`/member/payments/new/${registration.id}`}
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
                    href={`/member/payments/new/${registration.id}`}
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

              {/* Botón para cambiar medio de pago */}
              <Link
                href={`/member/payments/new/${registration.id}`}
                className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition active:scale-[0.98]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t("ticket.changePaymentMethod")}
              </Link>
            </div>
          )}

          {/* CASO 3: Pago Pendiente Sin Comprobante (No pagado) */}
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
                href={`/member/payments/new/${registration.id}`}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm transition active:scale-[0.98]"
              >
                <Coins className="h-4 w-4" />
                {t("ticket.payOrUploadReceipt")}
              </Link>
            </div>
          )}

          {/* CASO 4: Pago Aprobado / Confirmado */}
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

              {/* Vista previa miniatura pequeña del comprobante validado */}
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
                href={`/member/payments/new/${registration.id}`}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm transition active:scale-[0.98]"
              >
                <RefreshCw className="h-4 w-4" />
                {locale === "en" ? "Upload New Receipt" : "Subir Nuevo Comprobante"}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 3. ACCIONES INFERIORES */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border/85 text-sm">
        <Link
          href="/member/tickets"
          className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground hover:bg-secondary transition"
        >
          {t("ticket.viewAllTickets")}
        </Link>
        <Link
          href={hasTransport ? "/member/transport" : "/member/payments"}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary/90 transition"
        >
          {hasTransport
            ? t("ticket.manageTransport")
            : t("ticket.paymentSummary")}
        </Link>
        <button
          onClick={() => {
            if (!qr) return;
            const a = document.createElement("a");
            a.href = qr;
            a.download = `${event.slug ?? event.title}-ticket.png`;
            document.body.appendChild(a);
            a.click();
            a.remove();
          }}
          className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground hover:bg-secondary transition"
        >
          {t("ticket.download")}
        </button>
        <ResendButton registrationId={registration.id} />
      </div>
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
      // show toast in app (omitted)
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={resend}
      disabled={loading}
      className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground hover:bg-secondary transition"
    >
      {loading ? t("ticket.sending") : t("ticket.resend")}
    </button>
  );
}
