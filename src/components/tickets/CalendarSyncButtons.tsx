"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import { toast } from "sonner";
import { Calendar, Link as LinkIcon, Download } from "lucide-react";

interface Stop {
  id: string;
  name: string;
  latitude: string | null;
  longitude: string | null;
}

interface CalendarSyncButtonsProps {
  event: {
    id: string;
    title: string;
    description: string | null;
    date: Date | string;
    location: string | null;
    isVirtual: boolean;
  };
  className?: string;
}

export function CalendarSyncButtons({ event, className = "" }: CalendarSyncButtonsProps) {
  const { locale } = useLocale();

  const handleIcsDownload = () => {
    try {
      const eventDate = new Date(event.date);
      const start = eventDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
      const end = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
      
      const icsLines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Eventia//Event Calendar//ES",
        "BEGIN:VEVENT",
        `UID:${event.id}@Eventia.com`,
        `DTSTAMP:${start}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${(event.description ?? "").replace(/\n/g, "\\n")}`,
        `LOCATION:${event.location ?? (event.isVirtual ? "Virtual" : "")}`,
        "END:VEVENT",
        "END:VCALENDAR"
      ];

      const blob = new Blob([icsLines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${event.title.toLowerCase().replace(/\s+/g, "-")}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(
        locale === "en" ? "Calendar file (.ics) downloaded!" : "¡Archivo de calendario (.ics) descargado!"
      );
    } catch (error) {
      toast.error("Error al generar archivo de calendario");
    }
  };

  const getGoogleCalendarUrl = () => {
    const eventDate = new Date(event.date);
    const start = eventDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const end = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description ?? "");
    const location = encodeURIComponent(event.location ?? (event.isVirtual ? "Virtual" : ""));

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleIcsDownload}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground hover:bg-secondary transition-all cursor-pointer"
        title="Descargar archivo .ics para Apple Calendar / Outlook"
      >
        <Calendar className="h-3.5 w-3.5 text-primary" />
        {locale === "en" ? "Apple/Outlook (.ics)" : "Calendario (.ics)"}
      </button>
      <a
        href={getGoogleCalendarUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground hover:bg-secondary transition-all cursor-pointer"
        title="Sincronizar directamente con Google Calendar"
      >
        <LinkIcon className="h-3.5 w-3.5 text-primary" />
        Google Calendar
      </a>
    </div>
  );
}
