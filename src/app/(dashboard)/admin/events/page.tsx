import { db } from "@/lib/db";
import { events, users } from "@/lib/db/schema";
import { count, desc, eq, and, gte, lte, type SQL } from "drizzle-orm";
import Link from "next/link";
import { Calendar, Plus } from "lucide-react";
import { DeleteEventButton } from "./DeleteEventButton";
import { getI18n } from "@/lib/i18n/server";
import { categoryLabel, eventStatusLabel } from "@/lib/utils";
import { getIntlLocale } from "@/lib/i18n/core";
import { TablePagination } from "@/components/dashboard/TablePagination";
import { ExportDataPanel } from "@/components/dashboard/ExportDataPanel";
import { getExportEventOptions } from "@/actions/exports";
import { getCategories } from "@/actions/events";
import { Suspense } from "react";

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
    if (params.eventId) {
        conditions.push(eq(events.id, params.eventId));
    }
    if (params.category) {
        conditions.push(eq(events.category, params.category));
    }
    if (params.status && params.status !== "all") {
        conditions.push(eq(events.status, params.status as any));
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
            organizerName: users.name,
        })
        .from(events)
        .innerJoin(users, eq(events.organizerId, users.id))
        .where(whereClause)
        .orderBy(desc(events.createdAt))
        .limit(PAGE_SIZE)
        .offset(offset);

    const statusColor: Record<string, string> = {
        published: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        draft: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
        cancelled: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
        completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
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
                <Link
                    href="/admin/events/new"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
                >
                    <Plus className="h-4 w-4" />
                    {t("common.createEvent")}
                </Link>
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
                    ) : (
                        <Link
                            href="/admin/events/new"
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="h-4 w-4" /> {t("common.createEvent")}
                        </Link>
                    )}
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <p className="px-3 pt-2 text-[11px] text-muted-foreground sm:hidden">↔ Scroll</p>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[820px] text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">N°</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("dashboard.admin.title")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.organizer")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.category")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.date")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.status")}</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t("common.actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {allEvents.map((event, index) => (
                                    <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 text-muted-foreground">{rowStart + index + 1}</td>
                                        <td className="px-4 py-3 font-medium text-foreground">{event.title}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{event.organizerName ?? "—"}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{categoryLabel(event.category, locale)}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {new Date(event.date).toLocaleDateString(getIntlLocale(locale), {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[event.status] ?? ""}`}>
                                                {eventStatusLabel(event.status, locale)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-3 text-xs">
                                                <Link
                                                    href={`/events/${event.slug}`}
                                                    target="_blank"
                                                    className="text-primary hover:underline"
                                                >
                                                    {t("common.view")}
                                                </Link>
                                                <Link
                                                    href={`/admin/events/${event.id}`}
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
                        basePath="/admin/events"
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
