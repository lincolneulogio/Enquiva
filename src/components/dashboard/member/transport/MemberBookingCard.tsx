"use client";

import Link from "next/link";
import { Ticket } from "lucide-react";
import { CancelTransportButton } from "@/components/tickets/TransportBookingForm";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { getPluralLabel, getPaymentStatusLabel } from "@/lib/i18n/core";
import {
  type BookingItem,
  PAYMENT_STATUS_STYLES,
  BOOKING_STATUS_STYLES,
  getBookingStatusLabel,
} from "./types";

interface MemberBookingCardProps {
  booking: BookingItem;
}

export function MemberBookingCard({ booking }: MemberBookingCardProps) {
  const t = useTranslations();
  const { locale } = useLocale();

  const seatWord = getPluralLabel(
    locale,
    t("dashboard.member.seatsLabel"),
    `${t("dashboard.member.seatsLabel")}s`,
    booking.seats,
  );
  const payStatus = booking.paymentStatus ?? "pending";
  const bookStatus = booking.status ?? "pending";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-3xs hover:shadow-2xs transition-all duration-200 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h3 className="font-bold text-foreground text-lg leading-tight">
            {booking.routeName}
          </h3>
          <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
            <Ticket className="h-4 w-4 text-primary shrink-0" />
            <span>
              {booking.seats} {seatWord} ·{" "}
              <span className="text-foreground font-bold">
                S/. {Number(booking.paymentAmount).toFixed(2)}
              </span>
            </span>
          </p>
          <div className="space-y-1 pt-1">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="font-semibold text-foreground uppercase tracking-wider text-[10px]">
                Salida:
              </span>
              <span>{booking.departurePoint}</span>
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="font-semibold text-foreground uppercase tracking-wider text-[10px]">
                Fecha/Hora:
              </span>
              <span className="capitalize">
                {new Date(booking.departureTime).toLocaleDateString(
                  locale === "es" ? "es-PE" : "en-US",
                  {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap sm:flex-col sm:items-end gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              {t("dashboard.member.paymentLabel")}:
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                PAYMENT_STATUS_STYLES[payStatus] ?? PAYMENT_STATUS_STYLES.pending
              }`}
            >
              {getPaymentStatusLabel(payStatus, locale)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              {t("dashboard.member.bookingStatusLabel")}:
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                BOOKING_STATUS_STYLES[bookStatus] ?? BOOKING_STATUS_STYLES.pending
              }`}
            >
              {getBookingStatusLabel(bookStatus, locale)}
            </span>
          </div>
        </div>
      </div>

      {payStatus === "pending" && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-xs text-amber-800 dark:text-amber-300">
            <p className="font-bold flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              Requiere pago consolidado
            </p>
            <p className="text-muted-foreground mt-0.5">
              Puedes completar el pago consolidado (entrada + transporte) de forma unificada.
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {booking.status === "pending" && (
              <CancelTransportButton bookingId={booking.id} />
            )}
            <Link
              href={`/checkout/${booking.registrationId}`}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-all shadow-xs hover:shadow"
            >
              Pagar S/. {Number(booking.paymentAmount).toFixed(2)}
            </Link>
          </div>
        </div>
      )}

      {payStatus !== "pending" && booking.status === "pending" && (
        <div className="flex justify-end pt-2 border-t border-border/40">
          <CancelTransportButton bookingId={booking.id} />
        </div>
      )}
    </div>
  );
}
