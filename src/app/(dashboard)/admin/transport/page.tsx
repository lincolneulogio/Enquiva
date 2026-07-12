import { db } from "@/lib/db";
import { events, users } from "@/lib/db/schema";
import { count, desc, eq, sql, and, type SQL } from "drizzle-orm";
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
import { resolveAdminScope, scopeEventCondition } from "@/lib/organizations/admin-scope";
import { staffDashboardPath } from "@/lib/navigation/dashboard-paths";
import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";

interface AdminTransportPageProps {
    searchParams: Promise<{
        page?: string;
    }>;
}

const PAGE_SIZE = 10;

export default async function AdminTransportOverviewPage({ searchParams }: AdminTransportPageProps) {
    const { locale, t } = await getI18n();
  const staffBase = await getStaffBaseFromRequest();
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user || !["admin", "super_admin"].includes(session.user.role ?? "")) {
        redirect("/login");
    }

    const params = await searchParams;
    const requestedPage = Number(params.page ?? "1");
    const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

    const adminScope = await resolveAdminScope();
    const orgEventFilter = scopeEventCondition(adminScope);
    const eventConditions: SQL[] = [];
    if (orgEventFilter) eventConditions.push(orgEventFilter);
    const eventsWhere = eventConditions.length ? and(...eventConditions) : undefined;

    // Get counts and stats for admin dashboard card summary
    const [{ total }] = await db.select({ total: count() }).from(events).where(eventsWhere);
    
    const [{ totalWithTransport }] = await db
        .select({ totalWithTransport: sql<number>`count(*)::int` })
        .from(events)
        .where(
            eventsWhere
                ? and(...eventConditions, eq(events.hasTransport, true))
                : eq(events.hasTransport, true),
        );

    const [{ totalRoutes }] = await db
        .select({ totalRoutes: sql<number>`count(*)::int` })
        .from(sql`transport_routes tr`)
        .innerJoin(events, sql`tr.event_id = ${events.id}`)
        .where(eventsWhere);

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
        .where(eventsWhere)
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
                        <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border bg-muted/10">
                            <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                                <Bus className="h-4 w-4 text-primary" />
                                {locale === "en" ? "Transport Ledger" : "Directorio de Transporte"}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-medium">
                                ↔ {locale === "en" ? "Scroll horizontally to view all columns" : "Desliza horizontalmente para ver todas las columnas"}
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1250px] table-fixed text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[240px]">{t("common.event")}</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[180px]">{t("common.organizer")}</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[130px]">{locale === "en" ? "Event Date" : "Fecha de Evento"}</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[120px]">{t("common.status")}</th>
                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[150px]">{t("common.transport")}</th>
                                        <th className="px-4 py-3.5 text-center font-medium text-muted-foreground w-[230px]">{t("dashboard.admin.transportMetrics")}</th>
                                        <th className="px-4 py-3.5 text-right font-medium text-muted-foreground w-[200px]">{t("common.actions")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {allEvents.map((event) => (
                                        <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-4 font-semibold text-foreground truncate" title={event.title}>
                                                {event.title}
                                            </td>
                                            <td className="px-4 py-4 text-muted-foreground truncate" title={event.organizerName ?? ""}>
                                                {event.organizerName ?? "—"}
                                            </td>
                                            <td className="px-4 py-4 text-muted-foreground">
                                                {new Date(event.date).toLocaleDateString(getIntlLocale(locale), {
                                                    dateStyle: "medium"
                                                })}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(event.status)}`}>
                                                    {eventStatusLabel(event.status, locale)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                {event.hasTransport ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/30">
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                                        {t("dashboard.admin.transportEnabled")}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-muted-foreground border border-border/80">
                                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                                        {t("dashboard.admin.transportDisabled")}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                {event.hasTransport ? (
                                                    <div className="flex items-center justify-center gap-2.5 text-xs leading-none">
                                                        <span className="inline-flex items-center gap-1 rounded-lg bg-secondary/80 px-2 py-1 text-muted-foreground font-semibold border border-border/50">
                                                            {t("dashboard.admin.transportRoutesLabel")}: <span className="text-foreground font-bold">{event.routesCount}</span>
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2 py-1 text-primary font-semibold">
                                                            {t("dashboard.admin.transportPassengersLabel")}: <span className="text-primary font-bold">{event.totalBookedSeats}</span>
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
                                                            className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors border border-border/50 active:scale-95"
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
                            basePath={staffDashboardPath(staffBase, "/transport")}
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
