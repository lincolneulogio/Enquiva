"use client";

import { Bell } from "lucide-react";

interface PushNotificationCardProps {
  locale: "es" | "en";
  pushNotificationTitle: string | null;
  orgDisplay: string;
  firstLetter: string;
  setSettingsValue: (key: string, value: any) => void;
}

export function PushNotificationCard({
  locale,
  pushNotificationTitle,
  orgDisplay,
  firstLetter,
  setSettingsValue,
}: PushNotificationCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Bell className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-foreground">
            {locale === "en" ? "Push notification title" : "Título de notificaciones push"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "en"
              ? "Brand name shown as the OS notification title. Event details appear in the body. Leave empty to use your organization name."
              : "Nombre de marca que aparece como título en el sistema operativo. El detalle del evento va en el cuerpo. Déjalo vacío para usar el nombre de la organización."}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground">
          {locale === "en" ? "Display title" : "Título visible"}
        </label>
        <input
          type="text"
          maxLength={64}
          value={pushNotificationTitle ?? ""}
          onChange={(e) => setSettingsValue("pushNotificationTitle", e.target.value.slice(0, 64))}
          placeholder={orgDisplay}
          className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
        />
        <p className="text-[11px] text-muted-foreground">
          {(pushNotificationTitle ?? "").trim().length}/64
          {locale === "en"
            ? " · Empty falls back to organization name"
            : " · Vacío usa el nombre de la organización"}
        </p>
      </div>

      <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          {locale === "en" ? "Preview" : "Vista previa"}
        </p>
        <div className="mx-auto max-w-sm rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-start gap-3 px-3.5 py-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
              {firstLetter}
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{orgDisplay}</p>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {locale === "en" ? "now" : "ahora"}
                </span>
              </div>
              <p className="text-xs font-medium text-foreground/90 line-clamp-1">
                {locale === "en" ? "Payment approved" : "Pago aprobado"}
              </p>
              <p className="text-[11px] text-muted-foreground line-clamp-2">
                {locale === "en"
                  ? "Your payment for Summer Summit was confirmed."
                  : "Tu pago para Summer Summit fue confirmado."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
