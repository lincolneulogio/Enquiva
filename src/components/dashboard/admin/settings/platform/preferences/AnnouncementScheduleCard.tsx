"use client";

interface AnnouncementScheduleCardProps {
  locale: "es" | "en";
  announcementStartsLocal: string;
  setAnnouncementStartsLocal: (val: string) => void;
  announcementEndsLocal: string;
  setAnnouncementEndsLocal: (val: string) => void;
  announcementEnabled: boolean;
}

export function AnnouncementScheduleCard({
  locale,
  announcementStartsLocal,
  setAnnouncementStartsLocal,
  announcementEndsLocal,
  setAnnouncementEndsLocal,
  announcementEnabled,
}: AnnouncementScheduleCardProps) {
  return (
    <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3 w-full min-w-0">
      <p className="text-xs font-semibold text-foreground">
        {locale === "en" ? "When to show the banner" : "Cuándo mostrar el banner"}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 w-full min-w-0">
        <div className="space-y-1 min-w-0">
          <label className="text-[11px] font-semibold text-foreground">
            {locale === "en" ? "Show from" : "Mostrar desde"}
          </label>
          <input
            type="datetime-local"
            value={announcementStartsLocal}
            onChange={(e) => setAnnouncementStartsLocal(e.target.value)}
            disabled={!announcementEnabled}
            className="w-full min-w-0 max-w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
          />
        </div>
        <div className="space-y-1 min-w-0">
          <label className="text-[11px] font-semibold text-foreground">
            {locale === "en" ? "Hide after" : "Ocultar después de"}
          </label>
          <input
            type="datetime-local"
            value={announcementEndsLocal}
            onChange={(e) => setAnnouncementEndsLocal(e.target.value)}
            disabled={!announcementEnabled}
            className="w-full min-w-0 max-w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
          />
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {locale === "en"
          ? "Leave empty to show whenever the banner is enabled. Times use the platform timezone."
          : "Vacío = se muestra mientras el banner esté activo. Las horas usan la zona horaria de la plataforma."}
      </p>
    </div>
  );
}
