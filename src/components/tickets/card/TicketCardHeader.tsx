"use client";

import React from "react";
import {
  Ticket as TicketIcon,
  Calendar,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Event, Registration } from "@/lib/db/schema";
import { formatEventDate, registrationStatusLabel } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { EventPresenceIndicator } from "@/components/events/EventPresenceIndicator";

interface TicketCardHeaderProps {
  event: Event;
  registration: Registration;
  primaryStatus: string;
  paymentStatus?: string;
  isExpanded: boolean;
  onToggle: () => void;
  locale: "es" | "en";
  t: (key: string, params?: Record<string, any>) => string;
}

export function TicketCardHeader({
  event,
  registration,
  primaryStatus,
  paymentStatus,
  isExpanded,
  onToggle,
  locale,
  t,
}: TicketCardHeaderProps) {
  return (
    <div
      onClick={onToggle}
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
            {registration.selectedScheduleLabel && (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary border border-primary/20">
                <Clock className="h-3 w-3 shrink-0" />
                <span>{registration.selectedScheduleLabel}</span>
              </span>
            )}
          </div>
          <EventPresenceIndicator
            eventId={event.id}
            currentUserId={registration.userId}
            className="mt-2"
          />
        </div>
      </div>

      {/* Statuses and Toggle Arrow */}
      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
        <div className="flex items-center gap-2">
          {paymentStatus && <PaymentStatusBadge status={paymentStatus} />}
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              primaryStatus === "registered" || primaryStatus === "checked_in"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50"
                : primaryStatus === "waitlisted"
                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50"
                : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50"
            }`}
          >
            {registrationStatusLabel(primaryStatus, locale)}
          </span>
        </div>

        <div className="rounded-xl border border-border bg-background p-1.5 hover:bg-secondary transition text-muted-foreground hover:text-foreground">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>
    </div>
  );
}
