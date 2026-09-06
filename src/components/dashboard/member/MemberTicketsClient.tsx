"use client";

import { useState } from "react";
import { TicketCard } from "@/components/tickets/TicketCard";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { Inbox, Compass } from "lucide-react";
import type { UnifiedTicketItem, MemberTicketsClientProps } from "./tickets/types";
import { DesktopTicketsSidebar } from "./tickets/DesktopTicketsSidebar";
import { MobileTicketsAccordion } from "./tickets/MobileTicketsAccordion";

export type { UnifiedTicketItem };

const ITEMS_PER_PAGE = 5;

export function MemberTicketsClient({ tickets }: MemberTicketsClientProps) {
  const { locale } = useLocale();
  const t = useTranslations();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "past">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string | null>(
    tickets.length > 0 ? tickets[0].registration.id : null,
  );

  if (tickets.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center max-w-2xl mx-auto space-y-4">
        <Inbox className="mx-auto h-12 w-12 text-primary/30 animate-pulse" />
        <div className="space-y-1">
          <p className="text-lg font-bold text-foreground">{t("dashboard.member.noTicketsYet")}</p>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.member.registerToGenerateTicket")}
          </p>
        </div>
      </div>
    );
  }

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleTabChange = (tab: "all" | "upcoming" | "past") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const filteredTickets = tickets.filter((item) => {
    const matchesSearch =
      item.event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.event.location &&
        item.event.location.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    const eventDate = new Date(item.event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (activeTab === "upcoming") return eventDate >= today;
    if (activeTab === "past") return eventDate < today;
    return true;
  });

  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const activeTicketItem =
    filteredTickets.find((item) => item.registration.id === selectedRegistrationId) ||
    filteredTickets[0];

  if (tickets.length === 1) {
    return (
      <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-300">
        <TicketCard
          ticket={tickets[0].ticket}
          event={tickets[0].event}
          registration={tickets[0].registration}
          paymentStatus={tickets[0].paymentStatus}
          paymentReceiptUrl={tickets[0].paymentReceiptUrl}
          paymentMethod={tickets[0].paymentMethod}
          transportBooking={tickets[0].transportBooking}
          transportOfferFromPrice={tickets[0].transportOfferFromPrice}
          guests={tickets[0].guests}
          attendeeName={tickets[0].attendeeName}
          defaultExpanded={true}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Desktop Left Sidebar */}
        <DesktopTicketsSidebar
          paginatedTickets={paginatedTickets}
          totalTicketsCount={tickets.length}
          selectedRegistrationId={selectedRegistrationId}
          onSelectRegistrationId={setSelectedRegistrationId}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          locale={locale}
        />

        {/* Desktop Right View */}
        <div className="hidden md:block md:col-span-7 lg:col-span-8 sticky top-6">
          {!activeTicketItem ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center max-w-lg mx-auto space-y-4">
              <Compass className="mx-auto h-12 w-12 text-primary/30" />
              <p className="text-sm text-muted-foreground font-semibold">
                {locale === "en"
                  ? "Select a ticket from the sidebar to view details"
                  : "Selecciona una entrada del panel lateral para ver detalles"}
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-border/80 bg-card p-0.5 shadow-3xs overflow-hidden animate-in fade-in zoom-in-97 duration-300">
              <TicketCard
                key={activeTicketItem.registration.id}
                ticket={activeTicketItem.ticket}
                event={activeTicketItem.event}
                registration={activeTicketItem.registration}
                paymentStatus={activeTicketItem.paymentStatus}
                paymentReceiptUrl={activeTicketItem.paymentReceiptUrl}
                paymentMethod={activeTicketItem.paymentMethod}
                transportBooking={activeTicketItem.transportBooking}
                transportOfferFromPrice={activeTicketItem.transportOfferFromPrice}
                guests={activeTicketItem.guests}
                attendeeName={activeTicketItem.attendeeName}
                defaultExpanded={true}
                isExpanded={true}
              />
            </div>
          )}
        </div>

        {/* Mobile View */}
        <MobileTicketsAccordion
          paginatedTickets={paginatedTickets}
          totalTicketsCount={tickets.length}
          selectedRegistrationId={selectedRegistrationId}
          onToggleRegistrationId={(id) =>
            setSelectedRegistrationId(selectedRegistrationId === id ? null : id)
          }
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          locale={locale}
        />
      </div>
    </div>
  );
}
