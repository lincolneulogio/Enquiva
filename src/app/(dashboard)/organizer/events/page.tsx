import { getOrganizerEvents } from "@/actions/events";
import Link from "next/link";
import { Calendar, Plus } from "lucide-react";
import { DeleteEventButton } from "./DeleteEventButton";
import { categoryLabel, eventStatusLabel, formatEventDateShort, statusColor } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";
import { ExportDataPanel } from "@/components/dashboard/ExportDataPanel";
import { getCategories } from "@/actions/events";

interface OrganizerEventsPageProps {
    searchParams: Promise<{
        status?: string;
    }>;
}

const STATUS_FILTERS = [
    { value: "all", labelKey: "common.all" },
    { value: "published", labelKey: "eventStatus.published" },
    { value: "draft", labelKey: "eventStatus.draft" },
    { value: "cancelled", labelKey: "eventStatus.cancelled" },
    { value: "completed", labelKey: "eventStatus.completed" },
] as const;

export default async function OrganizerEventsPage({ searchParams }: OrganizerEventsPageProps) {
    const { locale, t } = await getI18n();
    const params = await searchParams;
    const organizerEvents = await getOrganizerEvents();
    const categories = await getCategories();
    const categoryMap = Object.fromEntries(categories.map((category) => [category.slug, category.label]));

    const activeStatus = STATUS_FILTERS.some((f) => f.value === params.status)
        ? (params.status as (typeof STATUS_FILTERS)[number]["value"])
        : "all";

    const filteredEvents =
        activeStatus === "all"
            ? organizerEvents
            : organizerEvents.filter(({ event }) => event.status === activeStatus);
    const exportEventOptions = organizerEvents.map(({ event }) => ({ id: event.id, title: event.title }));
    const exportCategoryOptions = categories.map((category) => ({
        value: category.slug,
        label: category.label,
    }));
    const exportStatusOptions = STATUS_FILTERS.map((filter) => ({
        value: filter.value,
        label: t(filter.labelKey),
    }));

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-semibold text-foreground">{t("dashboard.organizer.myEvents")}</h1>
                    <p className="mt-1 text-muted-foreground">
                        {t("dashboard.organizer.createdByYou", {
                            count: organizerEvents.length,
                            label: organizerEvents.length === 1 ? "evento" : "eventos",
                        })}
                    </p>
                </div>
                <Link
                    href="/organizer/events/new"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
                >
                    <Plus className="h-4 w-4" />
                    {t("common.newEvent")}
                </Link>
            </div>

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

            <ExportDataPanel
                resource="events"
                scope="organizer"
                eventOptions={exportEventOptions}
                categoryOptions={exportCategoryOptions}
                statusOptions={exportStatusOptions}
                initialStatus={activeStatus}
            />

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
                        <table className="w-full min-w-[820px] text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("dashboard.admin.title")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.category")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.date")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.status")}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.registrations")}</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t("common.actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredEvents.map(({ event, attendeeCount }) => (
                                    <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium text-foreground">{event.title}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{categoryMap[event.category] ?? categoryLabel(event.category, locale)}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{formatEventDateShort(event.date, locale)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(event.status)}`}>
                                                {eventStatusLabel(event.status, locale)}
                                            </span>
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
                </div>
            )}
        </div>
    );
}
