"use client";

import { Ticket } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { MemberBookingCard } from "./MemberBookingCard";
import type { BookingItem } from "./types";

interface BookingsHistoryTabProps {
  myBookings: BookingItem[];
  onGoToBookTab: () => void;
}

export function BookingsHistoryTab({ myBookings, onGoToBookTab }: BookingsHistoryTabProps) {
  const { locale } = useLocale();

  if (myBookings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center max-w-2xl mx-auto space-y-4">
        <Ticket className="mx-auto h-12 w-12 text-primary/30" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground text-lg">
            {locale === "en" ? "No bookings yet" : "Sin reservas de viaje"}
          </p>
          <p className="text-sm text-muted-foreground">
            {locale === "en"
              ? "Booked transport seats for your registered events will appear here."
              : "Las reservas de transporte que realices para tus eventos registrados aparecerán listadas aquí."}
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToBookTab}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/95 transition-all shadow-xs"
        >
          <span>{locale === "en" ? "Find Available Routes" : "Reservar un Asiento"}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 max-w-4xl">
      {myBookings.map((booking) => (
        <MemberBookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  );
}
