"use client";

import Link from "next/link";
import Image from "next/image";
import { Ticket, Event, Registration } from "@/lib/db/schema";
import { formatEventDate } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";

interface TicketCardProps {
  ticket?: Ticket | null;
  event: Event;
  registration: Registration;
  paymentStatus?: string;
}

export function TicketCard({ ticket, event, registration, paymentStatus }: TicketCardProps) {
  const qr = ticket?.qrCode;
  const hasTransport = Boolean(event.hasTransport);

  return (
    <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Your ticket</p>
          <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
        </div>
        {paymentStatus && <PaymentStatusBadge status={paymentStatus} />}
      </div>

      <div className="grid gap-3 rounded-2xl border border-dashed border-border bg-background/50 p-4">
        {qr ? (
          <div className="mx-auto w-32">
            <Image
              src={qr}
              alt="Ticket QR"
              width={200}
              height={200}
              className="mx-auto"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center rounded-xl bg-secondary text-xs uppercase text-muted-foreground">
            QR Pending
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {formatEventDate(event.date)}
        </p>
        <p className="text-sm text-muted-foreground">
          Registration status: <span className="font-medium text-foreground">{registration.status}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Ticket code: <span className="font-medium text-foreground">{ticket?.code ?? "Generating..."}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Escanea el QR para abrir el ticket verificable en una URL segura.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link
          href="/member/tickets"
          className="rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground hover:bg-secondary transition"
        >
          View all tickets
        </Link>
        <Link
          href={
            hasTransport
              ? "/member/transport"
              : "/member/payments"
          }
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary/90 transition"
        >
          {hasTransport ? "Manage transport" : "Payment summary"}
        </Link>
      </div>
    </div>
  );
}
