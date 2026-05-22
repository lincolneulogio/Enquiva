import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bus, Calendar, Route, Users, MapPin, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { formatEventDateShort, eventStatusLabel, statusColor } from "@/lib/utils";
import { ToggleEventTransportButton } from "@/components/dashboard/ToggleEventTransportButton";

export default async function OrganizerTransportOverviewPage() {
    const { t, locale } = await getI18n();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/login");

    // Fetch organizer events with transport metrics
    const organizerEvents = await db
        .select({
            id: events.id,
            title: events.title,
            slug: events.slug,
            date: events.date,
            status: events.status,
            hasTransport: events.hasTransport,
            routesCount: sql<number>`(
                SELECT count(*)::int
                FROM transport_routes tr
                WHERE tr.event_id = "events"."id"
            )`.as("routes_count"),
            totalBookedSeats: sql<number>`(
                SELECT COALESCE(SUM(tb.seats), 0)::int
                FROM transport_bookings tb
                INNER JOIN transport_routes tr ON tb.route_id = tr.id
                WHERE tr.event_id = "events"."id"
                  AND tb.status != 'cancelled'
            )`.as("total_booked_seats"),
        })
        .from(events)
        .where(eq(events.organizerId, session.user.id))
        .orderBy(desc(events.createdAt));

    // Calculate generic stats
    const eventsWithTransport = organizerEvents.filter((e) => e.hasTransport);
    const totalRoutes = eventsWithTransport.reduce((sum, e) => sum + (e.routesCount ?? 0), 0);
    const totalPassengers = eventsWithTransport.reduce((sum, e) => sum + (e.totalBookedSeats ?? 0), 0);

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <div>
                <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                    {t("dashboard.organizer.transportTitle") || "Gestión de Transporte"}
                </h1>
                <p className="mt-1 text-muted-foreground">
                    Administra de forma global las rutas de traslado y cupos de tus eventos organizados.
                </p>
            </div>

            {/* Stats Dashboard */}
            {organizerEvents.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-3">
                    {[
                        {
                            label: "Eventos con Transporte",
                            value: eventsWithTransport.length,
                            icon: Bus,
                            color: "text-blue-500",
                            bg: "bg-blue-500/10",
                        },
                        {
                            label: "Total de Rutas Activas",
                            value: totalRoutes,
                            icon: Route,
                            color: "text-green-500",
                            bg: "bg-green-500/10",
                        },
                        {
                            label: "Pasajeros Registrados",
                            value: totalPassengers,
                            icon: Users,
                            color: "text-purple-500",
                            bg: "bg-purple-500/10",
                        },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                        <div
                            key={label}
                            className="rounded-2xl border border-border bg-card p-5 sm:p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{label}</p>
                                    <p className="mt-1 font-display text-2xl font-semibold text-foreground sm:text-3xl">
                                        {value}
                                    </p>
                                </div>
                                <div className={`rounded-xl p-3 ${bg}`}>
                                    <Icon className={`h-5 w-5 ${color}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Content List */}
            {organizerEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <Bus className="mx-auto h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-4 font-semibold text-foreground">Aún no has creado eventos</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Crea tu primer evento para poder habilitar y gestionar rutas de transporte.
                    </p>
                    <Link
                        href="/organizer/events/new"
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        Crear Evento
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    <h2 className="font-display text-lg font-semibold text-foreground">Tus Eventos y Servicios de Traslado</h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        {organizerEvents.map((event) => (
                            <div
                                key={event.id}
                                className={`rounded-2xl border bg-card p-6 flex flex-col justify-between transition-all hover:shadow-md ${
                                    event.hasTransport ? "border-border" : "border-border/60 opacity-80"
                                }`}
                            >
                                <div className="space-y-4">
                                    {/* Event Info */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-foreground text-lg truncate" title={event.title}>
                                                {event.title}
                                            </h3>
                                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>{formatEventDateShort(event.date, locale)}</span>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(event.status)}`}>
                                            {eventStatusLabel(event.status, locale)}
                                        </span>
                                    </div>

                                    {/* Transport Status and Description */}
                                    {event.hasTransport ? (
                                        <div className="rounded-xl border border-green-200/50 bg-green-500/5 dark:border-green-800/40 p-4 space-y-3">
                                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                                <span className="text-xs font-medium">Servicio de transporte habilitado</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t border-green-200/20 pt-2.5">
                                                <div>
                                                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/60">Rutas activas</span>
                                                    <span className="font-semibold text-foreground text-sm">{event.routesCount}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground/60">Pasajeros</span>
                                                    <span className="font-semibold text-foreground text-sm">{event.totalBookedSeats}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-amber-200/50 bg-amber-500/5 dark:border-amber-800/40 p-4 space-y-2">
                                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                                <span className="text-xs font-medium">Transporte deshabilitado</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Habilita el transporte para agregar puntos de salida, tarifas y cupos para este evento.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-3 flex-wrap">
                                    <ToggleEventTransportButton
                                        eventId={event.id}
                                        initialHasTransport={event.hasTransport}
                                    />
                                    {event.hasTransport && (
                                        <Link
                                            href={`/organizer/events/${event.id}/transport`}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                        >
                                            Gestionar rutas
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
