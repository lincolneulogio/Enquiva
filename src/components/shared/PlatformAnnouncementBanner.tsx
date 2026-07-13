"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Info, Megaphone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnnouncementSeverity } from "@/lib/settings/platform-ops";

const severityStyles: Record<
  AnnouncementSeverity,
  { bar: string; icon: string; Icon: typeof Info }
> = {
  info: {
    bar: "border-sky-500/30 bg-sky-500/10 text-foreground",
    icon: "text-sky-700 dark:text-sky-300",
    Icon: Info,
  },
  warning: {
    bar: "border-amber-500/35 bg-amber-500/10 text-foreground",
    icon: "text-amber-800 dark:text-amber-300",
    Icon: AlertTriangle,
  },
  critical: {
    bar: "border-rose-500/35 bg-rose-500/10 text-foreground",
    icon: "text-rose-700 dark:text-rose-300",
    Icon: Megaphone,
  },
};

function dismissKey(message: string) {
  return `evora-announcement-dismissed:${message.slice(0, 120)}`;
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

  if (!visible || !enabled || !text) return null;

  const style = severityStyles[severity] ?? severityStyles.info;
  const Icon = style.Icon;

  return (
    <div
      role="status"
      className={cn(
        "sticky top-0 z-[60] border-b px-3 py-2.5 sm:px-4",
        style.bar,
      )}
    >
      <div className="mx-auto flex max-w-6xl items-start gap-3 sm:items-center">
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0 sm:mt-0", style.icon)} aria-hidden />
        <p className="min-w-0 flex-1 text-left text-xs sm:text-sm font-medium leading-snug whitespace-pre-wrap">
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
            className="rounded-md p-1 text-muted-foreground transition hover:bg-background/50 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
