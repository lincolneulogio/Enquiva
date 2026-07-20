"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Clock, Info, Megaphone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnnouncementSeverity } from "@/lib/settings/platform-ops";
import { isWithinInclusiveStartWindow } from "@/lib/datetime/zoned-day";
import { useLocale } from "@/components/providers/LocaleProvider";

export const BANNER_OFFSET_VAR = "--enquiva-banner-offset";

const severityStyles: Record<
  AnnouncementSeverity,
  {
    bar: string;
    rail: string;
    iconWrap: string;
    close: string;
    chip: string;
    Icon: typeof Info;
  }
> = {
  info: {
    bar: "bg-primary/12 text-foreground border-primary/25 backdrop-blur-md",
    rail: "bg-primary",
    iconWrap: "bg-primary/15 text-primary",
    close: "text-foreground/70 hover:bg-primary/15 hover:text-foreground",
    chip: "bg-primary/15 text-primary border-primary/25",
    Icon: Info,
  },
  warning: {
    bar: "bg-accent/18 text-foreground border-accent/35 backdrop-blur-md",
    rail: "bg-accent",
    iconWrap: "bg-accent/20 text-accent",
    close: "text-foreground/70 hover:bg-accent/20 hover:text-foreground",
    chip: "bg-accent/20 text-accent border-accent/30",
    Icon: AlertTriangle,
  },
  critical: {
    bar: "bg-primary text-primary-foreground border-primary shadow-sm",
    rail: "bg-primary-foreground/35",
    iconWrap: "bg-primary-foreground/15 text-primary-foreground",
    close:
      "text-primary-foreground/85 hover:bg-primary-foreground/15 hover:text-primary-foreground",
    chip: "bg-primary-foreground/15 text-primary-foreground border-primary-foreground/25",
    Icon: Megaphone,
  },
};

function dismissKey(parts: {
  message: string;
  eventAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
}) {
  return `enquiva-announcement-dismissed:${parts.message.slice(0, 80)}|${parts.eventAt ?? ""}|${parts.startsAt ?? ""}|${parts.endsAt ?? ""}`;
}

function setBannerOffset(px: number) {
  const value = `${Math.max(0, px)}px`;
  document.documentElement.style.setProperty(BANNER_OFFSET_VAR, value);
  document.body.style.paddingTop = value;
}

function clearBannerOffset() {
  document.documentElement.style.setProperty(BANNER_OFFSET_VAR, "0px");
  document.body.style.paddingTop = "";
}

function parseIso(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatEventLabel(date: Date, locale: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale.startsWith("en") ? "en-US" : "es-PE", {
    timeZone: timeZone || undefined,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function relativeLabel(target: Date, now: Date, locale: string): string | null {
  const diffMs = target.getTime() - now.getTime();
  const absMin = Math.round(Math.abs(diffMs) / 60_000);
  if (absMin < 1) {
    return locale.startsWith("en") ? "now" : "ahora";
  }
  const rtf = new Intl.RelativeTimeFormat(locale.startsWith("en") ? "en" : "es", {
    numeric: "auto",
  });
  if (absMin < 60) return rtf.format(diffMs > 0 ? absMin : -absMin, "minute");
  const hours = Math.round(absMin / 60);
  if (hours < 48) return rtf.format(diffMs > 0 ? hours : -hours, "hour");
  const days = Math.round(hours / 24);
  return rtf.format(diffMs > 0 ? days : -days, "day");
}

export function PlatformAnnouncementBanner({
  enabled,
  message,
  severity = "info",
  dismissible = true,
  startsAt = null,
  endsAt = null,
  eventAt = null,
  timeZone,
}: {
  enabled: boolean;
  message: string;
  severity?: AnnouncementSeverity;
  dismissible?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  eventAt?: string | null;
  timeZone?: string;
}) {
  const { locale } = useLocale();
  const text = message.trim();
  const [now, setNow] = useState(() => new Date());
  const [dismissed, setDismissed] = useState(false);
  const barRef = useRef<HTMLElement>(null);

  const startDate = useMemo(() => parseIso(startsAt), [startsAt]);
  const endDate = useMemo(() => parseIso(endsAt), [endsAt]);
  const eventDate = useMemo(() => parseIso(eventAt), [eventAt]);

  const inWindow = isWithinInclusiveStartWindow(now, startDate, endDate);
  const shouldShow = enabled && Boolean(text) && inWindow && !dismissed;

  useEffect(() => {
    try {
      const key = dismissKey({
        message: text,
        eventAt,
        startsAt,
        endsAt,
      });
      setDismissed(dismissible && sessionStorage.getItem(key) === "1");
    } catch {
      setDismissed(false);
    }
  }, [text, eventAt, startsAt, endsAt, dismissible]);

  useEffect(() => {
    // Re-evaluar ventanas de horario sin recargar la página.
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!shouldShow) {
      clearBannerOffset();
      return;
    }

    const el = barRef.current;
    if (!el) return;

    const sync = () => setBannerOffset(el.getBoundingClientRect().height);

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    window.addEventListener("resize", sync);
    window.addEventListener("brand-accent-changed", sync);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener("brand-accent-changed", sync);
      clearBannerOffset();
    };
  }, [shouldShow, text, severity, eventAt]);

  if (!shouldShow) return null;

  const style = severityStyles[severity] ?? severityStyles.info;
  const Icon = style.Icon;
  const eventLabel = eventDate
    ? formatEventLabel(eventDate, locale, timeZone)
    : null;
  const relative = eventDate ? relativeLabel(eventDate, now, locale) : null;

  return (
    <section
      ref={barRef}
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-0 top-0 z-[45] w-full overflow-hidden border-b",
        style.bar,
      )}
    >
      <div
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1 sm:w-1.5", style.rail)}
      />
      <div className="relative mx-auto flex w-full max-w-[100vw] items-center gap-3 py-2.5 pl-4 pr-3 sm:gap-3.5 sm:px-6 sm:pl-7 lg:px-8 lg:pl-9">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            style.iconWrap,
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          {eventLabel ? (
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  style.chip,
                )}
              >
                <Clock className="h-3 w-3" />
                {eventLabel}
              </span>
              {relative ? (
                <span className="text-[10px] font-medium opacity-80">{relative}</span>
              ) : null}
            </div>
          ) : null}
          <p className="text-left text-xs sm:text-sm font-semibold leading-snug tracking-tight whitespace-pre-wrap">
            {text}
          </p>
        </div>
        {dismissible ? (
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => {
              try {
                sessionStorage.setItem(
                  dismissKey({
                    message: text,
                    eventAt,
                    startsAt,
                    endsAt,
                  }),
                  "1",
                );
              } catch {
                /* ignore */
              }
              setDismissed(true);
            }}
            className={cn("shrink-0 rounded-md p-1.5 transition", style.close)}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
