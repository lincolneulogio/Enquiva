import Link from "next/link";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import {
  type ViewerEventStatus,
  VIEWER_EVENT_STATUS_I18N_KEY,
} from "@/lib/events/viewer-event-status";
import { ViewerEventStatusBadge } from "@/components/events/ViewerEventStatusBadge";
import { translate, type Locale } from "@/lib/i18n/core";

export const memberEventsAccentMap = {
  primary: {
    section: "bg-primary/8 border-primary/20 text-primary",
    dot: "bg-primary",
    badge: "bg-primary/10 text-primary border border-primary/20",
    cal: "bg-primary text-primary-foreground",
  },
  green: {
    section: "bg-emerald-500/8 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
    cal: "bg-emerald-600 text-white",
  },
  amber: {
    section: "bg-amber-500/8 border-amber-500/20 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
    cal: "bg-amber-500 text-white",
  },
  red: {
    section: "bg-red-500/8 border-red-500/20 text-red-600 dark:text-red-400",
    dot: "bg-red-500",
    badge: "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20",
    cal: "bg-red-600 text-white",
  },
};

export function MemberEventSection({
  title,
  count,
  accent,
  icon,
  faded = false,
  children,
}: {
  title: string;
  count: number;
  accent: keyof typeof memberEventsAccentMap;
  icon: React.ReactNode;
  faded?: boolean;
  children: React.ReactNode;
}) {
  const a = memberEventsAccentMap[accent];
  return (
    <section className={faded ? "opacity-60" : ""}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${a.section}`}>
          {icon}
          {title}
        </div>
        <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${a.badge}`}>
          {count}
        </span>
        <div className="flex-1 h-px bg-border/60" />
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

export function MemberEventCard({
  event,
  registration,
  status,
  locale,
  intlLocale,
  statusLabel,
  viewerStatus,
  viewLabel,
  getMonthAbbr,
  getDay,
}: {
  event: { title: string; slug: string; date: Date; location: string | null; isVirtual: boolean };
  registration: { id: string; status: string };
  status: "upcoming" | "checked_in" | "waitlisted" | "cancelled";
  locale: Locale;
  intlLocale: string;
  formatDate: (d: Date) => string;
  getMonthAbbr: (d: Date) => string;
  getDay: (d: Date) => string;
  statusLabel: string;
  viewerStatus: ViewerEventStatus;
  viewLabel: string;
}) {
  const accent =
    status === "upcoming"
      ? "primary"
      : status === "checked_in"
        ? "green"
        : status === "waitlisted"
          ? "amber"
          : "red";
  const a = memberEventsAccentMap[accent];

  const month = getMonthAbbr(event.date).toUpperCase();
  const day = getDay(event.date);

  const eventDate = new Date(event.date).toLocaleDateString(intlLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const location =
    event.location ??
    (event.isVirtual
      ? locale === "en" ? "Virtual" : "Virtual"
      : locale === "en" ? "TBD" : "Por definir");

  return (
    <div className="group relative flex gap-3 rounded-2xl border border-border bg-card p-3.5 hover:border-primary/30 hover:bg-card/80 transition-all duration-200 overflow-hidden">
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-full ${a.dot}`} />

      {/* Calendar date badge */}
      <div className={`shrink-0 flex flex-col items-center justify-center rounded-xl w-11 h-11 text-center ${a.cal} shadow-sm`}>
        <span className="text-[9px] font-bold uppercase leading-none opacity-80">{month}</span>
        <span className="text-lg font-black leading-none">{day}</span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {event.title}
        </p>
        <div className="mt-1.5 flex flex-col gap-0.5">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            {eventDate}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{location}</span>
          </span>
        </div>
      </div>

      {/* Right: badge + link */}
      <div className="shrink-0 flex flex-col items-end justify-between gap-2 ml-1">
        {status === "cancelled" ? (
          <span className={`text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${a.badge}`}>
            {statusLabel}
          </span>
        ) : (
          <ViewerEventStatusBadge
            status={viewerStatus}
            label={translate(locale, VIEWER_EVENT_STATUS_I18N_KEY[viewerStatus])}
            className="max-w-44"
          />
        )}
        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          {viewLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
