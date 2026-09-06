"use client";

import React from "react";
import {
    Bell,
    CreditCard,
    Ticket,
    Bus,
    UserPlus,
    CalendarDays,
    AlertTriangle,
    Wallet,
    Save,
    Loader2,
} from "lucide-react";

interface PlatformNotificationsTabProps {
    locale: "es" | "en";
    pushNotificationTitle: string | null;
    platformOrgName: string;
    initialOrgName?: string;
    alertPayments: boolean;
    alertRegistrations: boolean;
    alertTransport: boolean;
    alertOrganizerRequests: boolean;
    alertEventPublished: boolean;
    alertSubscriptionPastDue: boolean;
    alertFinance: boolean;
    setSettingsValue: (key: string, value: any) => void;
    handleSaveNotifications: () => void;
    isSaving: boolean;
}

export function PlatformNotificationsTab({
    locale,
    pushNotificationTitle,
    platformOrgName,
    initialOrgName,
    alertPayments,
    alertRegistrations,
    alertTransport,
    alertOrganizerRequests,
    alertEventPublished,
    alertSubscriptionPastDue,
    alertFinance,
    setSettingsValue,
    handleSaveNotifications,
    isSaving,
}: PlatformNotificationsTabProps) {
    const alertList = [
        {
            key: "payments",
            checked: alertPayments,
            onChange: () => setSettingsValue("alertPayments", !alertPayments),
            Icon: CreditCard,
            tone: {
                row: "border-emerald-500/25 bg-emerald-500/[0.06]",
                icon: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                toggleOn: "bg-emerald-600",
                chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
            },
            chipEs: "Pagos",
            chipEn: "Payments",
            titleEs: "Nuevos pagos de eventos",
            titleEn: "New event payments",
            descEs: "Aviso cuando se registre un pago de entrada o transporte (Culqi, efectivo u otros medios).",
            descEn: "Alert when a ticket or transport payment is registered (Culqi, cash, or other methods).",
        },
        {
            key: "registrations",
            checked: alertRegistrations,
            onChange: () => setSettingsValue("alertRegistrations", !alertRegistrations),
            Icon: Ticket,
            tone: {
                row: "border-violet-500/25 bg-violet-500/[0.06]",
                icon: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
                toggleOn: "bg-violet-600",
                chip: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
            },
            chipEs: "Registros",
            chipEn: "Registrations",
            titleEs: "Nuevos registros",
            titleEn: "New registrations",
            descEs: "Aviso cuando un asistente se inscriba en un evento.",
            descEn: "Alert when an attendee registers for an event.",
        },
        {
            key: "transport",
            checked: alertTransport,
            onChange: () => setSettingsValue("alertTransport", !alertTransport),
            Icon: Bus,
            tone: {
                row: "border-sky-500/25 bg-sky-500/[0.06]",
                icon: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
                toggleOn: "bg-sky-600",
                chip: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
            },
            chipEs: "Transporte",
            chipEn: "Transport",
            titleEs: "Aforo crítico de transporte (90%)",
            titleEn: "Transport route occupancy (90%)",
            descEs: "Alerta cuando una ruta alcance el 90% de capacidad.",
            descEn: "Alert when a route reaches 90% capacity.",
        },
        {
            key: "organizers",
            checked: alertOrganizerRequests,
            onChange: () => setSettingsValue("alertOrganizerRequests", !alertOrganizerRequests),
            Icon: UserPlus,
            tone: {
                row: "border-orange-500/25 bg-orange-500/[0.06]",
                icon: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
                toggleOn: "bg-orange-600",
                chip: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
            },
            chipEs: "Equipo",
            chipEn: "Team",
            titleEs: "Solicitudes de organizador",
            titleEn: "Organizer join requests",
            descEs: "Copia a superadmins cuando alguien pide unirse a una entidad como organizador.",
            descEn: "Also notify super admins when someone requests to join an entity as organizer.",
        },
        {
            key: "events",
            checked: alertEventPublished,
            onChange: () => setSettingsValue("alertEventPublished", !alertEventPublished),
            Icon: CalendarDays,
            tone: {
                row: "border-blue-500/25 bg-blue-500/[0.06]",
                icon: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
                toggleOn: "bg-blue-600",
                chip: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
            },
            chipEs: "Eventos",
            chipEn: "Events",
            titleEs: "Eventos publicados",
            titleEn: "Events published",
            descEs: "Aviso de plataforma cuando se publica un evento nuevo.",
            descEn: "Platform alert when a new event is published.",
        },
        {
            key: "subscriptions",
            checked: alertSubscriptionPastDue,
            onChange: () => setSettingsValue("alertSubscriptionPastDue", !alertSubscriptionPastDue),
            Icon: AlertTriangle,
            tone: {
                row: "border-rose-500/25 bg-rose-500/[0.06]",
                icon: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
                toggleOn: "bg-rose-600",
                chip: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
            },
            chipEs: "SaaS",
            chipEn: "SaaS",
            titleEs: "Suscripciones en mora",
            titleEn: "Past-due subscriptions",
            descEs: "Alerta operativa cuando un plan de organizador pasa a past_due.",
            descEn: "Ops alert when an organizer plan becomes past_due.",
        },
        {
            key: "finance",
            checked: alertFinance,
            onChange: () => setSettingsValue("alertFinance", !alertFinance),
            Icon: Wallet,
            tone: {
                row: "border-amber-500/25 bg-amber-500/[0.06]",
                icon: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
                toggleOn: "bg-amber-600",
                chip: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
            },
            chipEs: "Finanzas",
            chipEn: "Finance",
            titleEs: "Resumen financiero diario",
            titleEn: "Daily financial summary",
            descEs: "Al inicio del día (zona horaria de plataforma) envía el balance del día anterior: eventos + SaaS.",
            descEn: "At the start of the day (platform timezone) sends yesterday's balance: events + SaaS.",
        },
    ] as const;

    const orgDisplay = (pushNotificationTitle ?? "").trim() || (platformOrgName || initialOrgName || "Enquiva").trim();
    const firstLetter = orgDisplay.charAt(0).toUpperCase() || "E";

    return (
        <div className="space-y-6">
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

            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">
                        {locale === "en" ? "System alert subscriptions" : "Suscripción de alertas del sistema"}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {locale === "en"
                            ? "Choose which platform events notify super administrators. Each alert type uses its own color."
                            : "Elige qué eventos de plataforma notifican a los superadministradores. Cada tipo tiene su color."}
                    </p>
                </div>

                <div className="space-y-3">
                    {alertList.map((alert) => (
                        <div
                            key={alert.key}
                            className={`flex items-start sm:items-center justify-between gap-3 rounded-xl border p-4 transition-colors ${alert.tone.row}`}
                        >
                            <div className="flex min-w-0 flex-1 items-start gap-3">
                                <div
                                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${alert.tone.icon}`}
                                >
                                    <alert.Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 space-y-1 pr-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-semibold text-foreground">
                                            {locale === "en" ? alert.titleEn : alert.titleEs}
                                        </p>
                                        <span
                                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${alert.tone.chip}`}
                                        >
                                            {locale === "en" ? alert.chipEn : alert.chipEs}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {locale === "en" ? alert.descEn : alert.descEs}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={alert.onChange}
                                aria-pressed={alert.checked}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                                    alert.checked ? alert.tone.toggleOn : "bg-muted-foreground/30"
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                        alert.checked ? "translate-x-5" : "translate-x-0"
                                    }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="pt-2 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSaveNotifications}
                        disabled={isSaving}
                        className="w-full sm:w-auto justify-center flex items-center gap-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 text-xs transition duration-200 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {locale === "en" ? "Save push & alerts" : "Guardar push y alertas"}
                    </button>
                </div>
            </div>
        </div>
    );
}
