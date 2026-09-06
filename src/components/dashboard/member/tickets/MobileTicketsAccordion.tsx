"use client";

import { Inbox } from "lucide-react";
import { TicketCard } from "@/components/tickets/TicketCard";
import type { UnifiedTicketItem } from "./types";
import { TicketFiltersCard } from "./TicketFiltersCard";
import { TicketPaginationBar } from "./TicketPaginationBar";

interface MobileTicketsAccordionProps {
  paginatedTickets: UnifiedTicketItem[];
  totalTicketsCount: number;
  selectedRegistrationId: string | null;
  onToggleRegistrationId: (id: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  activeTab: "all" | "upcoming" | "past";
  onTabChange: (tab: "all" | "upcoming" | "past") => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  locale?: "es" | "en";
}

export function MobileTicketsAccordion({
  paginatedTickets,
  totalTicketsCount,
  selectedRegistrationId,
  onToggleRegistrationId,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  currentPage,
  totalPages,
  onPageChange,
  locale = "es",
}: MobileTicketsAccordionProps) {
  return (
    <div className="flex md:hidden flex-col gap-4">
      <TicketFiltersCard
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        activeTab={activeTab}
        onTabChange={onTabChange}
        totalCount={totalTicketsCount}
        locale={locale}
      />

      {/* Accordion Stack */}
      {paginatedTickets.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <Inbox className="mx-auto h-10 w-10 text-primary/30" />
          <p className="text-sm font-bold text-muted-foreground">
            {locale === "en" ? "No matching registrations found" : "No se encontraron inscripciones"}
          </p>
        </div>
      ) : (
        paginatedTickets.map((item) => {
          const isItemExpanded = item.registration.id === selectedRegistrationId;
          return (
            <div key={item.registration.id} className="animate-in fade-in duration-200">
              <TicketCard
                ticket={item.ticket}
                event={item.event}
                registration={item.registration}
                paymentStatus={item.paymentStatus}
                paymentReceiptUrl={item.paymentReceiptUrl}
                paymentMethod={item.paymentMethod}
                transportBooking={item.transportBooking}
                transportOfferFromPrice={item.transportOfferFromPrice}
                guests={item.guests}
                attendeeName={item.attendeeName}
                isExpanded={isItemExpanded}
                onToggle={() => onToggleRegistrationId(item.registration.id)}
              />
            </div>
          );
        })
      )}

      <TicketPaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        locale={locale}
        className="mt-2"
      />
    </div>
  );
}
