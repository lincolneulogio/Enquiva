"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Info, Megaphone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnnouncementSeverity } from "@/lib/settings/platform-ops";

export const BANNER_OFFSET_VAR = "--evora-banner-offset";

const severityStyles: Record<
  AnnouncementSeverity,
  {
    bar: string;
    rail: string;
    iconWrap: string;
    close: string;
    Icon: typeof Info;
  }
> = {
  /** Aviso suave — tinte del acento activo. */
  info: {
    bar: "bg-primary/12 text-foreground border-primary/25 backdrop-blur-md",
    rail: "bg-primary",
    iconWrap: "bg-primary/15 text-primary",
    close: "text-foreground/70 hover:bg-primary/15 hover:text-foreground",
    Icon: Info,
  },
  /** Destacado — usa el tono accent del esquema. */
  warning: {
    bar: "bg-accent/18 text-foreground border-accent/35 backdrop-blur-md",
    rail: "bg-accent",
    iconWrap: "bg-accent/20 text-accent",
    close: "text-foreground/70 hover:bg-accent/20 hover:text-foreground",
    Icon: AlertTriangle,
  },
  /** Urgente — barra sólida con el color primary del acento. */
  critical: {
    bar: "bg-primary text-primary-foreground border-primary shadow-sm",
    rail: "bg-primary-foreground/35",
    iconWrap: "bg-primary-foreground/15 text-primary-foreground",
    close:
      "text-primary-foreground/85 hover:bg-primary-foreground/15 hover:text-primary-foreground",
    Icon: Megaphone,
  },
};

function dismissKey(message: string) {
  return `evora-announcement-dismissed:${message.slice(0, 120)}`;
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

export function PlatformAnnouncementBanner({
  enabled,
  message,
  severity = "info",
  dismissible = true,
}: {
  enabled: boolean;
  message: string;
  severity?: AnnouncementSeverity;
  dismissible?: boolean;
}) {
  const text = message.trim();
  const [visible, setVisible] = useState(false);
  const barRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled || !text) {
      setVisible(false);
      return;
    }
    try {
      if (dismissible && sessionStorage.getItem(dismissKey(text)) === "1") {
        setVisible(false);
        return;
      }
    } catch {
      /* ignore */
    }
    setVisible(true);
  }, [enabled, text, dismissible]);

  useEffect(() => {
    if (!visible) {
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
  }, [visible, text, severity]);

  if (!visible || !enabled || !text) return null;

  const style = severityStyles[severity] ?? severityStyles.info;
  const Icon = style.Icon;

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
        <p className="min-w-0 flex-1 text-left text-xs sm:text-sm font-semibold leading-snug tracking-tight whitespace-pre-wrap">
          {text}
        </p>
        {dismissible ? (
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => {
              try {
                sessionStorage.setItem(dismissKey(text), "1");
              } catch {
                /* ignore */
              }
              setVisible(false);
            }}
            className={cn(
              "shrink-0 rounded-md p-1.5 transition",
              style.close,
            )}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
