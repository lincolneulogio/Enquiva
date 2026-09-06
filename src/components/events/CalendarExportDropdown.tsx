"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, Check, Download, ExternalLink } from "lucide-react";
import { stripHtml } from "@/lib/utils";
import { toast } from "sonner";

interface CalendarExportDropdownProps {
  eventTitle: string;
  eventDescription?: string | null;
  eventDate: Date | string;
  eventEndDate?: Date | string | null;
  eventLocation?: string | null;
  isVirtual?: boolean;
  className?: string;
  buttonLabel?: string;
}

export function CalendarExportDropdown({
  eventTitle,
  eventDescription,
  eventDate,
  eventEndDate,
  eventLocation,
  isVirtual = false,
  className = "",
  buttonLabel = "Añadir a mi calendario",
}: CalendarExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const startDate = new Date(eventDate);
  const endDate = eventEndDate
    ? new Date(eventEndDate)
    : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours fallback

  const cleanDescription = stripHtml(eventDescription || eventTitle);
  const locationText = isVirtual ? "Evento Virtual Oficial" : eventLocation || "Sede del evento";

  // Formato YYYYMMDDTHHMMSSZ para URLs de calendario
  const formatUtcIso = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  const startUtc = formatUtcIso(startDate);
  const endUtc = formatUtcIso(endDate);

  const getGoogleCalendarUrl = () => {
    const text = encodeURIComponent(eventTitle);
    const details = encodeURIComponent(cleanDescription);
    const loc = encodeURIComponent(locationText);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startUtc}/${endUtc}&details=${details}&location=${loc}`;
  };

  const getOutlookWebUrl = () => {
    const subject = encodeURIComponent(eventTitle);
    const body = encodeURIComponent(cleanDescription);
    const loc = encodeURIComponent(locationText);
    return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${subject}&body=${body}&location=${loc}&startdt=${startDate.toISOString()}&enddt=${endDate.toISOString()}&allday=false`;
  };

  const handleDownloadIcs = () => {
    try {
      const icsLines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Enquiva//Event Calendar//ES",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        `UID:${Date.now()}@enquiva.com`,
        `DTSTAMP:${startUtc}`,
        `DTSTART:${startUtc}`,
        `DTEND:${endUtc}`,
        `SUMMARY:${eventTitle}`,
        `DESCRIPTION:${cleanDescription.replace(/\n/g, "\\n")}`,
        `LOCATION:${locationText}`,
        "STATUS:CONFIRMED",
        "END:VEVENT",
        "END:VCALENDAR",
      ];

      const blob = new Blob([icsLines.join("\r\n")], {
        type: "text/calendar;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${eventTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Archivo .ics descargado para Apple Calendar o Outlook");
      setIsOpen(false);
    } catch {
      toast.error("No se pudo generar el archivo de calendario");
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/15 transition-all cursor-pointer select-none"
        aria-expanded={isOpen}
      >
        <Calendar className="h-3.5 w-3.5" />
        <span>{buttonLabel}</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-64 rounded-2xl border border-border/80 bg-white p-2 shadow-lg dark:bg-card animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50">
            Sincronizar Fecha
          </div>
          <div className="mt-1 space-y-1">
            <a
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
                <span>Google Calendar</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Web / App</span>
            </a>

            <button
              type="button"
              onClick={handleDownloadIcs}
              className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400">
                  <Download className="h-3.5 w-3.5" />
                </span>
                <span>Apple / iCal (.ics)</span>
              </div>
              <span className="text-[10px] text-muted-foreground">iPhone/Mac</span>
            </button>

            <a
              href={getOutlookWebUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
                <span>Microsoft Outlook</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Outlook.com</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
