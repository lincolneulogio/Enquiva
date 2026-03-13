"use client";

import Link from "next/link";
import Image from "next/image";
import { Ticket, Event, Registration } from "@/lib/db/schema";
import { formatEventDate, registrationStatusLabel } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";

interface TicketCardProps {
  ticket?: Ticket | null;
  event: Event;
  registration: Registration;
  paymentStatus?: string;
}

export function TicketCard({ ticket, event, registration, paymentStatus }: TicketCardProps) {
  const { locale } = useLocale();
  const t = useTranslations();
  const qr = ticket?.qrCode;
  const hasTransport = Boolean(event.hasTransport);

  return (
    <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("ticket.yourTicket")}</p>
          <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
        </div>
        {paymentStatus && <PaymentStatusBadge status={paymentStatus} />}
      </div>

      <div className="grid gap-3 rounded-2xl border border-dashed border-border bg-background/50 p-4">
        {qr ? (
          <div className="mx-auto w-32">
            <Image
              src={qr}
              alt={t("ticket.yourTicket")}
              width={200}
              height={200}
              className="mx-auto"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center rounded-xl bg-secondary text-xs uppercase text-muted-foreground">
            {t("ticket.qrPending")}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {formatEventDate(event.date, locale)}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("ticket.registrationStatus")}: <span className="font-medium text-foreground">{registrationStatusLabel(registration.status, locale)}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {t("ticket.ticketCode")}: <span className="font-medium text-foreground">{ticket?.code ?? t("ticket.generating")}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {t("ticket.secureQrHelp")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link
          href="/member/tickets"
          className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground hover:bg-secondary transition"
        >
          {t("ticket.viewAllTickets")}
        </Link>
        <Link
          href={
            hasTransport
              ? "/member/transport"
              : "/member/payments"
          }
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary/90 transition"
        >
          {hasTransport ? t("ticket.manageTransport") : t("ticket.paymentSummary")}
        </Link>
      </div>
    </div>
  );
}
