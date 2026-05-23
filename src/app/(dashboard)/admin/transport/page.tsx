import { db } from "@/lib/db";
import { events, users } from "@/lib/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Bus, Calendar, Route, Users, ArrowRight, ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { formatEventDateShort, eventStatusLabel, statusColor } from "@/lib/utils";
import { getIntlLocale } from "@/lib/i18n/core";
import { TablePagination } from "@/components/dashboard";
import { ToggleEventTransportButton } from "@/components/dashboard";

interface AdminTransportPageProps {
    searchParams: Promise<{
        page?: string;
    }>;
}

const PAGE_SIZE = 10;

export default async function AdminTransportOverviewPage({ searchParams }: AdminTransportPageProps) {
    const { locale, t } = await getI18n();
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || !["admin", "super_admin"].includes(session.user.role ?? "")) {
        redirect("/login");
    }

    const params = await searchParams;
    const requestedPage = Number(params.page ?? "1");
    const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

    // Get counts and stats for admin dashboard card summary
    const [{ total }] = await db.select({ total: count() }).from(events);
    
    const [{ totalWithTransport }] = await db
        .select({ totalWithTransport: sql<number>`count(*)::int` })
        .from(events)
        .where(eq(events.hasTransport, true));

    const [{ totalRoutes }] = await db
        .select({ totalRoutes: sql<number>`count(*)::int` })
        .from(sql`transport_routes`);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const offset = (safePage - 1) * PAGE_SIZE;

    // Paginated list of all events
    const allEvents = await db
        .select({
            id: events.id,
            title: events.title,
            slug: events.slug,
            status: events.status,
            date: events.date,
            hasTransport: events.hasTransport,
            organizerName: users.name,
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
        .innerJoin(users, eq(events.organizerId, users.id))
        .orderBy(desc(events.createdAt))
        .limit(PAGE_SIZE)
        .offset(offset);

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <div>
                <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                    {t("dashboard.admin.transport")}
                </h1>
                <p className="mt-1 text-muted-foreground">
                    {t("dashboard.admin.transportDescription")}
                </p>
            </div>

            {/* Stats Dashboard */}
            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    {
                        label: t("dashboard.admin.transportTotalEvents"),
                        value: total,
                        icon: ShieldAlert,
                        color: "text-amber-500",
                        bg: "bg-amber-500/10",
                    },
                    {
                        label: t("dashboard.admin.transportActiveEvents"),
                        value: totalWithTransport,
                        icon: Bus,
                        color: "text-blue-500",
                        bg: "bg-blue-500/10",
                    },
                    {
                        label: t("dashboard.admin.transportTotalRoutes"),
                        value: totalRoutes ?? 0,
                        icon: Route,
                        color: "text-green-500",
                        bg: "bg-green-500/10",
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

            {/* Events with Transport Table / View */}
            {allEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <Bus className="mx-auto h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-4 font-semibold text-foreground">{t("dashboard.admin.transportNoEvents")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t("dashboard.admin.transportNoEventsHelp")}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <h2 className="font-display text-lg font-semibold text-foreground">{t("dashboard.admin.transportRegisteredEvents")}</h2>
                    
                    <div className="overflow-hidden rounded-2xl border border-border bg-card">
                        <p className="px-3 pt-2 text-[11px] text-muted-foreground sm:hidden">↔ Scroll</p>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="px-4 py-3.5 text-left font-medium text-muted-foreground">{t("common.event")}</th>
                                        <th className="px-4 py-3.5 text-left font-medium text-muted-foreground">{t("common.organizer")}</th>
                                        <th className="px-4 py-3.5 text-left font-medium text-muted-foreground">{t("common.date")}</th>
                                        <th className="px-4 py-3.5 text-left font-medium text-muted-foreground">{t("common.status")}</th>
                                        <th className="px-4 py-3.5 text-left font-medium text-muted-foreground">{t("common.transport")}</th>
                                        <th className="px-4 py-3.5 text-center font-medium text-muted-foreground">{t("dashboard.admin.transportMetrics")}</th>
                                        <th className="px-4 py-3.5 text-right font-medium text-muted-foreground">{t("common.actions")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {allEvents.map((event) => (
                                        <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-4 font-medium text-foreground max-w-[220px] truncate" title={event.title}>
                                                {event.title}
                                            </td>
                                            <td className="px-4 py-4 text-muted-foreground">{event.organizerName ?? "—"}</td>
                                            <td className="px-4 py-4 text-muted-foreground">
                                                {new Date(event.date).toLocaleDateString(getIntlLocale(locale), {
                                                    dateStyle: "medium"
                                                })}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(event.status)}`}>
                                                    {eventStatusLabel(event.status, locale)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                {event.hasTransport ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        {t("dashboard.admin.transportEnabled")}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                                        {t("dashboard.admin.transportDisabled")}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                {event.hasTransport ? (
                                                    <div className="inline-flex items-center gap-4 text-xs">
                                                        <span className="text-muted-foreground">
                                                            {t("dashboard.admin.transportRoutesLabel")}: <strong className="text-foreground">{event.routesCount}</strong>
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {t("dashboard.admin.transportPassengersLabel")}: <strong className="text-foreground">{event.totalBookedSeats}</strong>
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <ToggleEventTransportButton
                                                        eventId={event.id}
                                                        initialHasTransport={event.hasTransport}
                                                        className="scale-90"
                                                    />
                                                    {event.hasTransport && (
                                                        <Link
                                                            href={`/admin/events/${event.id}/transport`}
                                                            className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors"
                                                        >
                                                            {t("dashboard.admin.transportRoutesBtn")}
                                                            <ArrowRight className="h-3.5 w-3.5" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <TablePagination
                            basePath="/admin/transport"
                            currentPage={safePage}
                            totalPages={totalPages}
                            totalItems={total}
                            pageSize={PAGE_SIZE}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
