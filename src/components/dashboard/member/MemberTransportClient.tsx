"use client";

import { useState } from "react";
import { Bus, Ticket, Lightbulb } from "lucide-react";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import {
  type EventOption,
  type BookingItem,
  AvailableRoutesTab,
  BookingsHistoryTab,
} from "./transport";

interface MemberTransportClientProps {
  options: EventOption[];
  myBookings: BookingItem[];
}

export function MemberTransportClient({ options, myBookings }: MemberTransportClientProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [activeTab, setActiveTab] = useState<"book" | "history">("book");

  // Filters to find only active options that have at least one route
  const availableOptions = options.filter((o) => o.routes.length > 0);
  const totalAvailableRoutesCount = availableOptions.reduce((sum, o) => sum + o.routes.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <Bus className="h-3.5 w-3.5" />
          {locale === "en" ? "Trips" : "Viajes"}
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("dashboard.member.transportTitle")}
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          {t("dashboard.member.transportSubtitle")}
        </p>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3.5 text-sm text-foreground">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Lightbulb className="h-4 w-4" />
          </div>
          <p className="text-muted-foreground">{t("dashboard.member.transportAddonNotice")}</p>
        </div>
      </div>

      {/* Segmented Tab Controls */}
      <div className="flex p-1.5 bg-muted/60 backdrop-blur-xs rounded-2xl border border-border/80 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("book")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold rounded-xl transition-all duration-200 select-none ${
            activeTab === "book"
              ? "bg-background text-primary shadow-xs border border-border/40"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bus className="h-4 w-4 shrink-0" />
          <span>{locale === "en" ? "Available Routes" : "Buscar Rutas"}</span>
          {totalAvailableRoutesCount > 0 && (
            <span
              className={`inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-bold rounded-full transition-colors ${
                activeTab === "book" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
              }`}
            >
              {totalAvailableRoutesCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold rounded-xl transition-all duration-200 select-none ${
            activeTab === "history"
              ? "bg-background text-primary shadow-xs border border-border/40"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Ticket className="h-4 w-4 shrink-0" />
          <span>{locale === "en" ? "My Bookings" : "Mis Reservas"}</span>
          {myBookings.length > 0 && (
            <span
              className={`inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-bold rounded-full transition-colors ${
                activeTab === "history" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
              }`}
            >
              {myBookings.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-8 animate-in fade-in-50 duration-200">
        {activeTab === "book" ? (
          <AvailableRoutesTab
            options={options}
            availableOptions={availableOptions}
          />
        ) : (
          <BookingsHistoryTab
            myBookings={myBookings}
            onGoToBookTab={() => setActiveTab("book")}
          />
        )}
      </div>
    </div>
  );
}
