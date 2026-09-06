"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Download, Wallet, Award } from "lucide-react";
import { toast } from "sonner";
import { Ticket, Event, Registration } from "@/lib/db/schema";
import { isCertificateEligible } from "@/lib/certificates/eligibility";
import { DownloadTicketButton } from "../DownloadTicketButton";
import { DownloadCertificateButton } from "@/components/certificates/DownloadCertificateButton";
import { CalendarSyncButtons } from "../CalendarSyncButtons";
import { useTranslations } from "@/components/providers/LocaleProvider";

interface TicketActionsBarProps {
  event: Event;
  registration: Registration;
  ticket?: Ticket | null;
  primaryStatus: string;
  paymentStatus?: string;
  hasTransport: boolean;
  attendeeName?: string | null;
  qrDataUrl: string | null;
  hasGuests: boolean;
  downloadingAll: boolean;
  onDownloadAll: () => void;
  onWalletInfo: (type: "apple" | "google") => void;
  locale: string;
  t: (key: string, params?: Record<string, any>) => string;
}

export function TicketActionsBar({
  event,
  registration,
  ticket,
  primaryStatus,
  paymentStatus,
  hasTransport,
  attendeeName,
  qrDataUrl,
  hasGuests,
  downloadingAll,
  onDownloadAll,
  onWalletInfo,
  locale,
  t,
}: TicketActionsBarProps) {
  return (
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
            {hasTransport ? t("ticket.manageTransport") : t("ticket.paymentSummary")}
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
              ticketSignature={ticket.signature}
              registrationStatus={registration.status}
              scheduleLabel={registration.selectedScheduleLabel}
              className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground hover:bg-secondary transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 select-none"
            />
          )}
          {/* Certificado Oficial (si fue solicitado) */}
          {registration.wantsCertificate &&
            (isCertificateEligible({
              wantsCertificate: registration.wantsCertificate,
              registrationStatus: primaryStatus,
              certificateCode: registration.certificateCode,
              eventDate: event.date,
              eventEndDate: event.endDate,
            }) ? (
              <DownloadCertificateButton
                data={{
                  certificateCode:
                    registration.certificateCode || `ENQ-${new Date().getFullYear()}-CERT`,
                  attendeeName: attendeeName || "Asistente",
                  eventTitle: event.title,
                  certificateTitle: event.certificateTitle,
                  eventDate: event.date,
                  eventLocation: event.location,
                  isVirtual: event.isVirtual,
                }}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold uppercase tracking-wide transition flex items-center gap-1.5 cursor-pointer shadow-xs select-none"
                label={locale === "en" ? "Official Certificate" : "Certificado Oficial"}
              />
            ) : (
              <button
                type="button"
                onClick={() =>
                  toast.info(
                    locale === "en"
                      ? `Your official certificate will be available upon check-in or once the event concludes (${new Date(event.date).toLocaleDateString()}).`
                      : `Tu certificado oficial estará disponible para descarga una vez que concluya el evento (${new Date(event.date).toLocaleDateString()}) o registres tu asistencia.`,
                  )
                }
                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide transition flex items-center gap-1.5 cursor-pointer select-none"
              >
                <Award className="h-3.5 w-3.5" />
                <span>{locale === "en" ? "Certificate Included" : "Certificado Incluido"}</span>
              </button>
            ))}
          {ticket && hasGuests && (
            <button
              type="button"
              disabled={downloadingAll}
              onClick={onDownloadAll}
              className="rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 select-none whitespace-nowrap"
            >
              <Download className="h-4 w-4 shrink-0 text-primary" />
              <span>
                {downloadingAll
                  ? locale === "en"
                    ? "Compiling..."
                    : "Compilando..."
                  : locale === "en"
                  ? "Download Group PDFs"
                  : "Descargar Todo (PDF)"}
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
            onClick={() => onWalletInfo("apple")}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground hover:bg-secondary transition flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap"
          >
            <Wallet className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Apple Wallet</span>
          </button>
          <button
            type="button"
            onClick={() => onWalletInfo("google")}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground hover:bg-secondary transition flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap"
          >
            <Wallet className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Google Wallet</span>
          </button>
          <ResendButton registrationId={registration.id} />
        </>
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
