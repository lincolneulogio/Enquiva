"use client";

import type { AnnouncementSeverity } from "@/lib/settings/platform-ops";

interface AnnouncementOptionsCardProps {
  locale: "es" | "en";
  announcementSeverity: AnnouncementSeverity;
  setAnnouncementSeverity: (val: AnnouncementSeverity) => void;
  announcementDismissible: boolean;
  setAnnouncementDismissible: (val: boolean) => void;
  announcementEnabled: boolean;
}

export function AnnouncementOptionsCard({
  locale,
  announcementSeverity,
  setAnnouncementSeverity,
  announcementDismissible,
  setAnnouncementDismissible,
  announcementEnabled,
}: AnnouncementOptionsCardProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground">
          {locale === "en" ? "Severity" : "Severidad"}
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "info", labelEs: "Info", labelEn: "Info" },
              { id: "warning", labelEs: "Aviso", labelEn: "Warning" },
              { id: "critical", labelEs: "Crítico", labelEn: "Critical" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={!announcementEnabled}
              onClick={() => setAnnouncementSeverity(opt.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                announcementSeverity === opt.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              {locale === "en" ? opt.labelEn : opt.labelEs}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/10 p-3">
        <div>
          <p className="text-xs font-semibold text-foreground">
            {locale === "en" ? "Dismissible" : "Se puede cerrar"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {locale === "en"
              ? "Users can hide it for this browser session"
              : "Los usuarios pueden ocultarlo en esta sesión"}
          </p>
        </div>
        <button
          type="button"
          disabled={!announcementEnabled}
          onClick={() => setAnnouncementDismissible(!announcementDismissible)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
            announcementDismissible ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
              announcementDismissible ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
