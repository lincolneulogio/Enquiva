"use client";

import React from "react";
import { Ticket as TicketIcon, Clock, Eye, Share2 } from "lucide-react";
import { Event } from "@/lib/db/schema";
import { registrationStatusLabel } from "@/lib/utils";
import { DownloadTicketButton } from "../DownloadTicketButton";
import { GuestTicketItem } from "./types";
import { absoluteUrl } from "@/lib/url";

interface GuestTicketsListProps {
  guestsState: GuestTicketItem[];
  event: Event;
  primaryStatus: string;
  paymentStatus?: string;
  locale: "es" | "en";
  onShowGuestQr: (guest: GuestTicketItem) => void;
}

export function GuestTicketsList({
  guestsState,
  event,
  primaryStatus,
  paymentStatus,
  locale,
  onShowGuestQr,
}: GuestTicketsListProps) {
  if (guestsState.length === 0) return null;

  const guestTicketShareUrl = (code: string, signature?: string | null) => {
    return signature
      ? absoluteUrl(`/ticket/${code}?s=${signature}`)
      : absoluteUrl(`/ticket/${code}`);
  };

  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-4 md:p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <TicketIcon className="h-4.5 w-4.5 text-primary" />
          {locale === "en" ? "Guest Tickets" : "Entradas de mis Invitados"}
        </h4>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full">
          {guestsState.length}{" "}
          {guestsState.length === 1
            ? locale === "en"
              ? "guest"
              : "invitado"
            : locale === "en"
            ? "guests"
            : "invitados"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        {guestsState.map((guest) => {
          const guestHasQr = Boolean(
            guest.ticket?.code && guest.ticket.signature,
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
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      isCheckedIn
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/50"
                        : guest.registration.status === "registered"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50"
                        : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50"
                    }`}
                  >
                    {registrationStatusLabel(guest.registration.status, locale)}
                  </span>
                  {guest.registration.selectedScheduleLabel && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary border border-primary/20">
                      <Clock className="h-2.5 w-2.5 shrink-0" />
                      <span>{guest.registration.selectedScheduleLabel}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Acciones de Invitado */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {(paymentStatus === "approved" || !paymentStatus) && guestHasQr ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onShowGuestQr(guest)}
                      className="rounded-xl border border-border hover:bg-secondary text-foreground px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-3xs transition duration-200 cursor-pointer select-none"
                    >
                      <Eye className="h-3.5 w-3.5 text-primary" />
                      <span>{locale === "en" ? "View QR" : "Ver QR"}</span>
                    </button>

                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        locale === "en"
                          ? `Hi ${guest.user.name}! Here is your entry ticket for the event *${event.title}*: ${guestTicketShareUrl(guest.ticket!.code, guest.ticket!.signature)} . See you there!`
                          : `¡Hola ${guest.user.name}! Aquí tienes tu entrada para el evento *${event.title}*: ${guestTicketShareUrl(guest.ticket!.code, guest.ticket!.signature)} . ¡Nos vemos allá!`,
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
                      scheduleLabel={guest.registration.selectedScheduleLabel}
                      className="rounded-xl border border-border bg-background hover:bg-secondary text-foreground px-3.5 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-3xs transition duration-200 cursor-pointer select-none"
                    />
                  </>
                ) : guest.registration.status === "cancelled" || primaryStatus === "cancelled" ? (
                  <span className="text-xs text-destructive font-medium">
                    {locale === "en" ? "Cancelled" : "Cancelado"}
                  </span>
                ) : paymentStatus === "rejected" ? (
                  <span className="text-xs text-destructive font-medium">
                    {locale === "en" ? "Payment rejected" : "Pago rechazado"}
                  </span>
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
  );
}
