"use client";

import { Calendar, MapPin, ChevronRight, Inbox } from "lucide-react";
import { formatEventDate, registrationStatusLabel } from "@/lib/utils";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import type { UnifiedTicketItem } from "./types";
import { TicketFiltersCard } from "./TicketFiltersCard";
import { TicketPaginationBar } from "./TicketPaginationBar";

interface DesktopTicketsSidebarProps {
  paginatedTickets: UnifiedTicketItem[];
  totalTicketsCount: number;
  selectedRegistrationId: string | null;
  onSelectRegistrationId: (id: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  activeTab: "all" | "upcoming" | "past";
  onTabChange: (tab: "all" | "upcoming" | "past") => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  locale?: "es" | "en";
}

export function DesktopTicketsSidebar({
  paginatedTickets,
  totalTicketsCount,
  selectedRegistrationId,
  onSelectRegistrationId,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  currentPage,
  totalPages,
  onPageChange,
  locale = "es",
}: DesktopTicketsSidebarProps) {
  return (
    <div className="hidden md:flex md:col-span-5 lg:col-span-4 flex-col gap-4">
      <TicketFiltersCard
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        activeTab={activeTab}
        onTabChange={onTabChange}
        totalCount={totalTicketsCount}
        locale={locale}
      />

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
                onClick={() => onSelectRegistrationId(item.registration.id)}
                className={`group relative flex flex-col gap-2.5 p-4.5 rounded-2xl border transition-all duration-300 cursor-pointer select-none ${
                  isActive
                    ? "bg-primary/5 border-primary/45 shadow-3xs"
                    : "bg-card border-border hover:bg-muted/30 hover:border-border/80"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-3.5 bottom-3.5 w-1 rounded-r-full bg-primary" />
                )}

                <div className="min-w-0 pr-4">
                  <h4
                    className={`font-extrabold text-sm leading-snug truncate transition-colors ${
                      isActive ? "text-primary" : "text-foreground group-hover:text-primary/90"
                    }`}
                  >
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
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      item.registration.status === "registered" || item.registration.status === "checked_in"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50"
                        : item.registration.status === "waitlisted"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50"
                          : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50"
                    }`}
                  >
                    {registrationStatusLabel(item.registration.status, locale)}
                  </span>
                  {item.paymentStatus && (
                    <PaymentStatusBadge status={item.paymentStatus} className="text-[9px] px-2 py-0.5" />
                  )}
                </div>

                <div
                  className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-hover:text-primary transition-all duration-300 ${
                    isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
                  }`}
                >
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            );
          })
        )}
      </div>

      <TicketPaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        locale={locale}
      />
    </div>
  );
}
