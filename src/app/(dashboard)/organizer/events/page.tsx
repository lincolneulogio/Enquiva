import { db } from "@/lib/db";
import { events, registrations } from "@/lib/db/schema";
import { eq, desc, and, gte, lte, count, sql, inArray } from "drizzle-orm";
import { OCCUPYING_REGISTRATION_STATUSES } from "@/lib/registrations/constants";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Calendar, Plus } from "lucide-react";
import { DeleteEventButton } from "@/components/events/DeleteEventButton";
import { categoryLabel, eventStatusLabel, formatEventDateShort, statusColor } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";
import { ExportDataPanel } from "@/components/dashboard";
import { Suspense } from "react";
import { getCategories } from "@/actions/events";
import { TablePagination } from "@/components/dashboard";
import { getExportEventOptions } from "@/actions/exports";
import { getMyPlanSummary } from "@/actions/billing";
import { planIncludesFeature } from "@/lib/billing/enforce";
import { PlanUsageBanner } from "@/components/dashboard/organizer/PlanUsageBanner";
import {
    getViewerEventStatuses,
    VIEWER_EVENT_STATUS_I18N_KEY,
} from "@/lib/events/viewer-event-status";
import { ViewerEventStatusBadge } from "@/components/events/ViewerEventStatusBadge";

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
    { value: "all", labelKey: "common.all" },
    { value: "published", labelKey: "eventStatus.published" },
    { value: "draft", labelKey: "eventStatus.draft" },
    { value: "cancelled", labelKey: "eventStatus.cancelled" },
    { value: "completed", labelKey: "eventStatus.completed" },
] as const;

interface OrganizerEventsPageProps {
    searchParams: Promise<{
        page?: string;
        status?: string;
        eventId?: string;
        category?: string;
        fromDate?: string;
        toDate?: string;
    }>;
}

export default async function OrganizerEventsPage({ searchParams }: OrganizerEventsPageProps) {
    const { locale, t } = await getI18n();
    const params = await searchParams;
    const session = await auth.api.getSession({ headers: await headers() });
    const organizerId = session!.user.id;

    const requestedPage = Number(params.page ?? "1");
    const currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;

    const categories = await getCategories();

    const activeStatus = STATUS_FILTERS.some((f) => f.value === params.status)
        ? (params.status as (typeof STATUS_FILTERS)[number]["value"])
        : "all";

    // Build filter conditions
    const conditions = [eq(events.organizerId, organizerId)];

    if (activeStatus !== "all") {
        conditions.push(eq(events.status, activeStatus));
    }
    if (params.eventId) {
        conditions.push(eq(events.id, params.eventId));
    }
    if (params.category) {
        conditions.push(eq(events.category, params.category));
    }
    if (params.fromDate) {
        conditions.push(gte(events.date, new Date(`${params.fromDate}T00:00:00.000`)));
    }
    if (params.toDate) {
        conditions.push(lte(events.date, new Date(`${params.toDate}T23:59:59.999`)));
    }

    const whereClause = and(...conditions);

    const [{ total }] = await db
        .select({ total: count() })
        .from(events)
        .where(whereClause);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const offset = (safePage - 1) * PAGE_SIZE;

    const filteredEvents = await db
        .select({
            event: events,
            attendeeCount: sql<number>`count(${registrations.id})::int`,
        })
        .from(events)
        .leftJoin(
            registrations,
            and(
                eq(registrations.eventId, events.id),
                inArray(registrations.status, [...OCCUPYING_REGISTRATION_STATUSES]),
            ),
        )
        .where(whereClause)
        .groupBy(events.id)
        .orderBy(desc(events.createdAt))
        .limit(PAGE_SIZE)
        .offset(offset);
    const viewerStatuses = await getViewerEventStatuses(
        organizerId,
        filteredEvents.map(({ event }) => event.id),
    );

    // Export options (all organizer events, unfiltered)
    const exportEventOptions = await getExportEventOptions("organizer");
    const exportCategoryOptions = categories.map((category) => ({
        value: category.slug,
        label: categoryLabel(category.slug, locale),
    }));
    const exportStatusOptions = STATUS_FILTERS.map((filter) => ({
        value: filter.value,
        label: t(filter.labelKey),
    }));

    const planSummary = await getMyPlanSummary();
    const showExports = planIncludesFeature(planSummary.plan, "exports", planSummary.isUnlimited);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-semibold text-foreground">{t("dashboard.organizer.myEvents")}</h1>
                    <p className="mt-1 text-muted-foreground">
                        {t("dashboard.organizer.createdByYou", {
                            count: total,
                            label: total === 1 ? "evento" : "eventos",
                        })}
                    </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Link
                        href="/events"
                        className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:w-auto"
                    >
                        {t("dashboard.member.exploreEvents")}
                    </Link>
                {planSummary.canCreateEvent ? (
                    <Link
                        href="/organizer/events/new"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
                    >
                        <Plus className="h-4 w-4" />
                        {t("common.newEvent")}
                    </Link>
                ) : planSummary.canManageBilling ? (
                    <Link
                        href="/organizer/billing"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200 sm:w-auto"
                    >
                        {t("dashboard.organizer.planUpgradeToCreateMore")}
                    </Link>
                ) : (
                    <p className="rounded-xl border border-amber-300/60 bg-amber-50/80 px-4 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200 sm:w-auto">
                        {t("dashboard.organizer.planLimitContactAdmin")}
                    </p>
                )}
                </div>
            </div>

            <PlanUsageBanner summary={planSummary} />

            <div className="flex flex-wrap items-center gap-2">
                {STATUS_FILTERS.map((filter) => {
                    const isActive = filter.value === activeStatus;
                    return (
                        <Link
                            key={filter.value}
                            href={
                                filter.value === "all"
                                    ? "/organizer/events"
                                    : `/organizer/events?status=${filter.value}`
                            }
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${isActive
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-muted-foreground hover:bg-secondary"
                                }`}
                        >
                            {t(filter.labelKey)}
                        </Link>
                    );
                })}
            </div>

            {showExports ? (
                <Suspense>
                    <ExportDataPanel
                        resource="events"
                        scope="organizer"
                        eventOptions={exportEventOptions}
                        categoryOptions={exportCategoryOptions}
                        statusOptions={exportStatusOptions}
                        initialStatus={activeStatus}
                    />
                </Suspense>
            ) : null}

            {filteredEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <Calendar className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 font-medium text-foreground">{t("dashboard.organizer.noEventsYet")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {activeStatus === "all"
                            ? t("dashboard.organizer.createFirstEventReceiveRegistrations")
                            : t("dashboard.organizer.noEventsForStatus", {
                                status: eventStatusLabel(activeStatus, locale).toLowerCase(),
                            })}
                    </p>
                    <Link
                        href="/organizer/events/new"
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="h-4 w-4" /> {t("common.createEvent")}
                    </Link>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <p className="px-3 pt-2 text-[11px] text-muted-foreground sm:hidden">↔ Scroll</p>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1020px] text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="w-12 px-3 py-3 text-left font-medium text-muted-foreground">N°</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("dashboard.admin.title")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.category")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.date")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("public.events.viewerStatus.eventStatusLabel")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("public.events.viewerStatus.label")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.registrations")}</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t("common.actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredEvents.map(({ event, attendeeCount }, index) => (
                                    <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-3 py-3 text-muted-foreground">{offset + index + 1}</td>
                                        <td className="px-4 py-3 font-medium text-foreground">{event.title}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{categoryLabel(event.category, locale)}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{formatEventDateShort(event.date, locale)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(event.status)}`}>
                                                {eventStatusLabel(event.status, locale)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {(() => {
                                                const viewerStatus =
                                                    viewerStatuses.get(event.id) ?? "not_registered";
                                                return (
                                                    <ViewerEventStatusBadge
                                                        status={viewerStatus}
                                                        label={t(VIEWER_EVENT_STATUS_I18N_KEY[viewerStatus])}
                                                    />
                                                );
                                            })()}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {attendeeCount ?? 0}
                                            {event.capacity ? ` / ${event.capacity}` : ""}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-3 text-xs">
                                                <Link href={`/events/${event.slug}`} className="text-primary hover:underline">
                                                    {t("common.view")}
                                                </Link>
                                                <Link
                                                    href={`/organizer/events/${event.id}`}
                                                    className="text-blue-600 hover:underline dark:text-blue-400"
                                                >
                                                    {t("common.edit")}
                                                </Link>
                                                <DeleteEventButton eventId={event.id} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <TablePagination
                        basePath="/organizer/events"
                        currentPage={safePage}
                        totalPages={totalPages}
                        totalItems={total}
                        pageSize={PAGE_SIZE}
                        query={{
                            status: activeStatus !== "all" ? activeStatus : undefined,
                            eventId: params.eventId,
                            category: params.category,
                            fromDate: params.fromDate,
                            toDate: params.toDate,
                        }}
                    />
                </div>
            )}
        </div>
    );
}
