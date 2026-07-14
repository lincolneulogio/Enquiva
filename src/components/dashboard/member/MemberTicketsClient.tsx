"use client";

import { useState } from "react";
import { Ticket, Event, Registration } from "@/lib/db/schema";
import { TicketCard } from "@/components/tickets/TicketCard";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import { formatEventDate, registrationStatusLabel } from "@/lib/utils";
import { Ticket as TicketIcon, Calendar, MapPin, ChevronRight, ChevronLeft, Inbox, Search, Compass } from "lucide-react";

interface UnifiedTicketItem {
  ticket?: Ticket | null;
  event: Event;
  registration: Registration;
  paymentStatus?: string;
  paymentReceiptUrl?: string | null;
  paymentMethod?: string | null;
  transportBooking?: {
    booking: {
      id: string;
      seats: number;
      status: string;
      notes: string | null;
      bookedAt: Date;
    };
    route: {
      name: string;
      departurePoint: string;
      departureTime: Date;
      returnTime: Date | null;
      pricePerSeat: string;
    };
    stop: {
      name: string;
      latitude: string | null;
      longitude: string | null;
    } | null;
  } | null;
  guests?: Array<{
    registration: Registration;
    ticket: Ticket | null;
    user: {
      name: string;
      email: string;
      phone: string | null;
    };
  }>;
  attendeeName?: string | null;
}

interface MemberTicketsClientProps {
  tickets: UnifiedTicketItem[];
}

const ITEMS_PER_PAGE = 5;

export function MemberTicketsClient({ tickets }: MemberTicketsClientProps) {
  const { locale } = useLocale();
  const t = useTranslations();

  // State for search, active tab filters, and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "past">("all");
  const [currentPage, setCurrentPage] = useState(1);

  // State for selected registration ID
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string | null>(
    tickets.length > 0 ? tickets[0].registration.id : null
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

  // Filter Reset Handlers (resets pagination to page 1)
  const handleSearchChange = (val: string) => {
    const query = val;
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleTabChange = (tab: "all" | "upcoming" | "past") => {
    const nextTab = tab;
    setActiveTab(nextTab);
    setCurrentPage(1);
  };

  // Filtering Logic
  const filteredTickets = tickets.filter((item) => {
    // 1. Search Query filter (checks title or location)
    const matchesSearch =
      item.event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.event.location &&
        item.event.location.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // 2. Date Tab Filter
    const eventDate = new Date(item.event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // start of today

    if (activeTab === "upcoming") {
      return eventDate >= today;
    }
    if (activeTab === "past") {
      return eventDate < today;
    }
    return true;
  });

  // Pagination Math
  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Automatically resolve the active selected ticket item from the filtered list (un-paginated safe fallback)
  const activeTicketItem =
    filteredTickets.find((item) => item.registration.id === selectedRegistrationId) ||
    filteredTickets[0];

  return (
    <div className="space-y-6">
      {/* CASE 1: EXACTLY 1 TICKET IN TOTAL -> Show beautiful full card directly */}
      {tickets.length === 1 ? (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-300">
          <TicketCard
            ticket={tickets[0].ticket}
            event={tickets[0].event}
            registration={tickets[0].registration}
            paymentStatus={tickets[0].paymentStatus}
            paymentReceiptUrl={tickets[0].paymentReceiptUrl}
            paymentMethod={tickets[0].paymentMethod}
            transportBooking={tickets[0].transportBooking}
            guests={tickets[0].guests}
            attendeeName={tickets[0].attendeeName}
            defaultExpanded={true}
          />
        </div>
      ) : (
        /* CASE 2: MULTIPLE TICKETS -> Master-Detail Split on Desktop, Single-Open Accordion on Mobile */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* LEFT SIDEBAR: Filters, List & Pagination (Desktop and Tablet) */}
          <div className="hidden md:flex md:col-span-5 lg:col-span-4 flex-col gap-4">
            
            {/* Filter Section Container */}
            <div className="flex flex-col gap-3 p-4.5 rounded-2xl bg-card border border-border/80 shadow-3xs">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                {locale === "en" ? "Search & Filters" : "Búsqueda y Filtros"}
              </span>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={locale === "en" ? "Search events..." : "Buscar eventos..."}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              {/* Tab Selector */}
              <div className="flex p-1 bg-muted/65 rounded-xl border border-border/80 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => handleTabChange("all")}
                  className={`flex-1 py-1.5 rounded-lg transition-all duration-200 select-none ${
                    activeTab === "all"
                      ? "bg-background text-primary shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {locale === "en" ? "All" : "Todas"} ({tickets.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("upcoming")}
                  className={`flex-1 py-1.5 rounded-lg transition-all duration-200 select-none ${
                    activeTab === "upcoming"
                      ? "bg-background text-primary shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {locale === "en" ? "Upcoming" : "Próximas"}
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("past")}
                  className={`flex-1 py-1.5 rounded-lg transition-all duration-200 select-none ${
                    activeTab === "past"
                      ? "bg-background text-primary shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {locale === "en" ? "Past" : "Pasadas"}
                </button>
              </div>
            </div>

            {/* Event List Sidebar Column */}
            <div className="flex flex-col gap-3 max-h-[52vh] overflow-y-auto pr-2 custom-scrollbar">
              {paginatedTickets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center space-y-2">
                  <Inbox className="mx-auto h-8 w-8 text-primary/30" />
                  <p className="text-xs font-bold text-muted-foreground leading-normal">
                    {locale === "en" ? "No matching registrations found" : "No se encontraron inscripciones"}
                  </p>
                </div>
              ) : (
                paginatedTickets.map((item) => {
                  const isActive = item.registration.id === selectedRegistrationId;
                  return (
                    <div
                      key={item.registration.id}
                      onClick={() => setSelectedRegistrationId(item.registration.id)}
                      className={`group relative flex flex-col gap-2.5 p-4.5 rounded-2xl border transition-all duration-300 cursor-pointer select-none ${
                        isActive
                          ? "bg-primary/5 border-primary/45 shadow-3xs"
                          : "bg-card border-border hover:bg-muted/30 hover:border-border/80"
                      }`}
                    >
                      {/* Left orange strip indicator for active selection */}
                      {isActive && (
                        <span className="absolute left-0 top-3.5 bottom-3.5 w-1 rounded-r-full bg-primary" />
                      )}

                      <div className="min-w-0 pr-4">
                        <h4 className={`font-extrabold text-sm leading-snug truncate transition-colors ${
                          isActive ? "text-primary" : "text-foreground group-hover:text-primary/90"
                        }`}>
                          {item.event.title}
                        </h4>
                        
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1.5 leading-none">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                          <span className="truncate">{formatEventDate(item.event.date, locale)}</span>
                        </div>

                        {item.event.location && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1 leading-none">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
                            <span className="truncate">{item.event.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Status Badges Row */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 border-t border-border/20 pt-2.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          item.registration.status === "registered" || item.registration.status === "checked_in"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50"
                            : item.registration.status === "waitlisted"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50"
                            : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50"
                        }`}>
                          {registrationStatusLabel(item.registration.status, locale)}
                        </span>
                        {item.paymentStatus && (
                          <PaymentStatusBadge status={item.paymentStatus} className="text-[9px] px-2 py-0.5" />
                        )}
                      </div>

                      {/* Absolute chevron indicator on hover */}
                      <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-hover:text-primary transition-all duration-300 ${
                        isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
                      }`}>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls (Desktop Sidebar bottom) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border/40 pt-3.5 text-[11px] font-bold text-foreground bg-card p-3 rounded-2xl border border-border/60 shadow-3xs select-none">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted/40 transition disabled:opacity-40 disabled:hover:bg-background cursor-pointer select-none"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>{locale === "en" ? "Prev" : "Ant"}</span>
                </button>

                <span className="text-muted-foreground font-extrabold tracking-wider">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted/40 transition disabled:opacity-40 disabled:hover:bg-background cursor-pointer select-none"
                >
                  <span>{locale === "en" ? "Next" : "Sig"}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* RIGHT VIEW: Selected Ticket Details Sheet (Desktop only) */}
          <div className="hidden md:block md:col-span-7 lg:col-span-8 sticky top-6">
            {!activeTicketItem ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center max-w-lg mx-auto space-y-4">
                <Compass className="mx-auto h-12 w-12 text-primary/30" />
                <p className="text-sm text-muted-foreground font-semibold">
                  {locale === "en" ? "Select a ticket from the sidebar to view details" : "Selecciona una entrada del panel lateral para ver detalles"}
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
                  guests={activeTicketItem.guests}
                  attendeeName={activeTicketItem.attendeeName}
                  defaultExpanded={true}
                  isExpanded={true} // Force details column to remain fully expanded
                />
              </div>
            )}
          </div>

          {/* MOBILE VIEW: Filter block + Single-Open Accordion Stack */}
          <div className="flex md:hidden flex-col gap-4">
            
            {/* Filter Section Container for Mobile */}
            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-card border border-border shadow-3xs">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={locale === "en" ? "Search events..." : "Buscar eventos..."}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden"
                />
              </div>

              {/* Tab Selector */}
              <div className="flex p-1 bg-muted/65 rounded-xl border border-border text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => handleTabChange("all")}
                  className={`flex-1 py-1.5 rounded-lg select-none ${
                    activeTab === "all" ? "bg-background text-primary shadow-2xs" : "text-muted-foreground"
                  }`}
                >
                  {locale === "en" ? "All" : "Todas"} ({tickets.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("upcoming")}
                  className={`flex-1 py-1.5 rounded-lg select-none ${
                    activeTab === "upcoming" ? "bg-background text-primary shadow-2xs" : "text-muted-foreground"
                  }`}
                >
                  {locale === "en" ? "Upcoming" : "Próximas"}
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("past")}
                  className={`flex-1 py-1.5 rounded-lg select-none ${
                    activeTab === "past" ? "bg-background text-primary shadow-2xs" : "text-muted-foreground"
                  }`}
                >
                  {locale === "en" ? "Past" : "Pasadas"}
                </button>
              </div>
            </div>

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
                      guests={item.guests}
                      attendeeName={item.attendeeName}
                      isExpanded={isItemExpanded}
                      onToggle={() =>
                        setSelectedRegistrationId(
                          isItemExpanded ? null : item.registration.id
                        )
                      }
                    />
                  </div>
                );
              })
            )}

            {/* Pagination Controls for Mobile Accordion Stack */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-card p-3 rounded-2xl border border-border shadow-3xs text-[11px] font-bold select-none mt-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted/40 transition disabled:opacity-40 disabled:hover:bg-background cursor-pointer select-none"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>{locale === "en" ? "Prev" : "Anterior"}</span>
                </button>

                <span className="text-muted-foreground font-extrabold">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-muted/40 transition disabled:opacity-40 disabled:hover:bg-background cursor-pointer select-none"
                >
                  <span>{locale === "en" ? "Next" : "Siguiente"}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
