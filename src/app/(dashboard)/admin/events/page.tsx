import { db } from "@/lib/db";
import { events, users, registrations, eventStatusEnum } from "@/lib/db/schema";
import { count, desc, eq, and, gte, lte, inArray, type SQL } from "drizzle-orm";
import Link from "next/link";
import { Calendar, Plus, ClipboardList } from "lucide-react";
import { DeleteEventButton } from "@/components/events/DeleteEventButton";
import { getI18n } from "@/lib/i18n/server";
import { categoryLabel, eventStatusLabel, formatCurrency } from "@/lib/utils";
import { getIntlLocale } from "@/lib/i18n/core";
import { TablePagination } from "@/components/dashboard";
import { ExportDataPanel } from "@/components/dashboard";
import { getExportEventOptions } from "@/actions/exports";
import { getCategories } from "@/actions/events";
import { Suspense } from "react";
import { resolveAdminScope, scopeEventCondition, canMutateEventRecord } from "@/lib/organizations/admin-scope";
import { staffDashboardPath } from "@/lib/navigation/dashboard-paths";
import { getStaffBaseFromRequest } from "@/lib/navigation/get-staff-base.server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { normalizeRole } from "@/lib/auth/rbac";
import {
    getViewerEventStatuses,
    VIEWER_EVENT_STATUS_I18N_KEY,
    type ViewerEventStatus,
} from "@/lib/events/viewer-event-status";
import { ViewerEventStatusBadge } from "@/components/events/ViewerEventStatusBadge";

interface AdminEventsPageProps {
    searchParams: Promise<{
        page?: string;
        eventId?: string;
        category?: string;
        status?: string;
        fromDate?: string;
        toDate?: string;
    }>;
}

const PAGE_SIZE = 10;

const EVENT_STATUS_VALUES = ["all", "published", "draft", "cancelled", "completed"] as const;

export default async function AdminEventsPage({ searchParams }: AdminEventsPageProps) {
    const { locale, t } = await getI18n();
    const session = await auth.api.getSession({ headers: await headers() });
    const role = normalizeRole(session?.user?.role);
    const canCreateEvents = role === "super_admin";
    const staffBase = await getStaffBaseFromRequest();
    const eventsPath = staffDashboardPath(staffBase, "events");
    const adminScope = await resolveAdminScope();
    const entityOrgId = adminScope.mode === "org" ? adminScope.organizationId : null;
    const orgEventFilter = scopeEventCondition(adminScope);
    const params = await searchParams;
    const requestedPage = Number(params.page ?? "1");
    const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

    const exportEventOptions = await getExportEventOptions("admin");
    const categories = await getCategories();
    const categoryMap = Object.fromEntries(categories.map((category) => [category.slug, categoryLabel(category.slug, locale)]));
    const exportCategoryOptions = categories.map((category) => ({
        value: category.slug,
        label: categoryLabel(category.slug, locale),
    }));
    const exportStatusOptions = EVENT_STATUS_VALUES.map((value) => ({
        value,
        label: value === "all" ? t("common.all") : t(`eventStatus.${value}`),
    }));

    // Build filter conditions
    const conditions: SQL[] = [];
    if (orgEventFilter) {
        conditions.push(orgEventFilter);
    }
    if (params.eventId) {
        conditions.push(eq(events.id, params.eventId));
    }
    if (params.category) {
        conditions.push(eq(events.category, params.category));
    }
    if (params.status && params.status !== "all") {
        const status = eventStatusEnum.enumValues.find((value) => value === params.status);
        if (status) {
            conditions.push(eq(events.status, status));
        }
    }
    if (params.fromDate) {
        conditions.push(gte(events.date, new Date(`${params.fromDate}T00:00:00.000`)));
    }
    if (params.toDate) {
        conditions.push(lte(events.date, new Date(`${params.toDate}T23:59:59.999`)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ total }] = await db
        .select({ total: count() })
        .from(events)
        .innerJoin(users, eq(events.organizerId, users.id))
        .where(whereClause);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const offset = (safePage - 1) * PAGE_SIZE;
    const rowStart = offset;

    const allEvents = await db
        .select({
            id: events.id,
            title: events.title,
            slug: events.slug,
            status: events.status,
            category: events.category,
            date: events.date,
            price: events.price,
            capacity: events.capacity,
            organizerId: events.organizerId,
            organizationId: events.organizationId,
            organizerName: users.name,
        })
        .from(events)
        .innerJoin(users, eq(events.organizerId, users.id))
        .where(whereClause)
        .orderBy(desc(events.createdAt))
        .limit(PAGE_SIZE)
        .offset(offset);

    const eventIds = allEvents.map((e) => e.id);
    const regCountsMap = new Map<string, number>();
    const viewerStatuses = session?.user
        ? await getViewerEventStatuses(session.user.id, eventIds)
        : new Map<string, ViewerEventStatus>();

    if (eventIds.length > 0) {
        const counts = await db
            .select({
                eventId: registrations.eventId,
                regCount: count(registrations.id),
            })
            .from(registrations)
            .where(inArray(registrations.eventId, eventIds))
            .groupBy(registrations.eventId);

        for (const c of counts) {
            regCountsMap.set(c.eventId, c.regCount);
        }
    }

    const statusColor: Record<string, string> = {
        published: "bg-green-100 text-green-900 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30",
        draft: "bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30",
        cancelled: "bg-red-100 text-red-900 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30",
        completed: "bg-blue-100 text-blue-900 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/30",
    };

    const isFiltered = !!(params.eventId || params.category || (params.status && params.status !== "all") || params.fromDate || params.toDate);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-semibold text-foreground">{t("dashboard.admin.allEvents")}</h1>
                    <p className="mt-1 text-muted-foreground">
                        {t("dashboard.admin.eventsOnPlatform", {
                            count: total,
                            label: total === 1 ? "evento" : "eventos",
                        })}
                        {isFiltered && (
                            <span className="ml-2 text-xs text-primary font-medium">({locale === "en" ? "filtered" : "filtrado"})</span>
                        )}
                    </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Link
                    href="/events"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:w-auto"
                >
                    {t("dashboard.member.exploreEvents")}
                </Link>
                {canCreateEvents && (
                <Link
                    href={`${eventsPath}/new`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
                >
                    <Plus className="h-4 w-4" />
                    {t("common.createEvent")}
                </Link>
                )}
                </div>
            </div>

            <Suspense>
                <ExportDataPanel
                    resource="events"
                    scope="admin"
                    eventOptions={exportEventOptions}
                    categoryOptions={exportCategoryOptions}
                    statusOptions={exportStatusOptions}
                />
            </Suspense>

            {allEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <Calendar className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 font-medium text-foreground">{t("dashboard.admin.noEventsYet")}</p>
                    {isFiltered ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {locale === "en" ? "No events match your filters." : "Ningún evento coincide con los filtros."}
                        </p>
                    ) : canCreateEvents ? (
                        <Link
                            href={`${eventsPath}/new`}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="h-4 w-4" /> {t("common.createEvent")}
                        </Link>
                    ) : (
                        <p className="mt-2 text-sm text-muted-foreground">{t("auth.adminCannotCreateEventsBody")}</p>
                    )}
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border bg-muted/10">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-primary" />
                            {locale === "en" ? "Events Ledger" : "Directorio de Eventos"}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-medium">
                            ↔ {locale === "en" ? "Scroll horizontally to view all columns" : "Desliza horizontalmente para ver todas las columnas"}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1600px] table-fixed text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[60px]">N°</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[260px]">{t("dashboard.admin.title")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[200px]">{t("common.organizer")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[150px]">{t("common.category")}</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-[130px]">{locale === "en" ? "Price" : "Precio"}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[180px]">{locale === "en" ? "Capacity / Registrants" : "Aforo / Inscritos"}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[140px]">{locale === "en" ? "Event Date" : "Fecha de Evento"}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[140px]">{t("public.events.viewerStatus.eventStatusLabel")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[190px]">{t("public.events.viewerStatus.label")}</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-[160px]">{t("common.actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {allEvents.map((event, index) => {
                                    const regCount = regCountsMap.get(event.id) ?? 0;
                                    const viewerStatus =
                                        viewerStatuses.get(event.id) ?? "not_registered";
                                    const canMutate = Boolean(
                                        session?.user &&
                                            canMutateEventRecord(
                                                {
                                                    organizerId: event.organizerId,
                                                    organizationId: event.organizationId,
                                                },
                                                session.user.id,
                                                role,
                                                entityOrgId,
                                            ),
                                    );
                                    return (
                                        <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-4 text-muted-foreground">{rowStart + index + 1}</td>
                                            <td className="px-4 py-4 font-medium text-foreground truncate" title={event.title}>{event.title}</td>
                                            <td className="px-4 py-4 text-muted-foreground truncate" title={event.organizerName ?? ""}>{event.organizerName ?? "—"}</td>
                                            <td className="px-4 py-4 text-muted-foreground truncate">{categoryLabel(event.category, locale)}</td>
                                            <td className="px-4 py-4 text-right font-semibold text-foreground">
                                                {event.price && Number(event.price) > 0 
                                                    ? formatCurrency(Number(event.price), "PEN", locale) 
                                                    : (locale === "en" ? "Free" : "Gratuito")
                                                }
                                            </td>
                                            <td className="px-4 py-4 text-muted-foreground text-xs leading-relaxed">
                                                <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                                                    <span className="text-primary">{regCount}</span> 
                                                    <span className="text-muted-foreground/60 font-normal">/</span>
                                                    <span>{event.capacity ? `${event.capacity}` : "∞"}</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground/80 block mt-0.5">
                                                    {event.capacity 
                                                        ? (locale === "en" ? `${event.capacity - regCount} remaining` : `${event.capacity - regCount} vacantes libres`) 
                                                        : (locale === "en" ? "unlimited vacancies" : "vacantes ilimitadas")
                                                    }
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-muted-foreground">
                                                {new Date(event.date).toLocaleDateString(getIntlLocale(locale), {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[event.status] ?? ""}`}>
                                                    {eventStatusLabel(event.status, locale)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <ViewerEventStatusBadge
                                                    status={viewerStatus}
                                                    label={t(VIEWER_EVENT_STATUS_I18N_KEY[viewerStatus])}
                                                />
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3 text-xs">
                                                    <Link
                                                        href={`/events/${event.slug}`}
                                                        target="_blank"
                                                        className="text-primary hover:underline font-semibold"
                                                    >
                                                        {t("common.view")}
                                                    </Link>
                                                    {canMutate ? (
                                                        <>
                                                            <Link
                                                                href={`${eventsPath}/${event.id}`}
                                                                className="text-blue-600 hover:underline dark:text-blue-400 font-semibold"
                                                            >
                                                                {t("common.edit")}
                                                            </Link>
                                                            <DeleteEventButton eventId={event.id} />
                                                        </>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <TablePagination
                        basePath={eventsPath}
                        currentPage={safePage}
                        totalPages={totalPages}
                        totalItems={total}
                        pageSize={PAGE_SIZE}
                        query={{
                            eventId: params.eventId,
                            category: params.category,
                            status: params.status,
                            fromDate: params.fromDate,
                            toDate: params.toDate,
                        }}
                    />
                </div>
            )}
        </div>
    );
}
