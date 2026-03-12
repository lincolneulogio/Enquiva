import { getOrganizerEvents } from "@/actions/events";
import Link from "next/link";
import { Calendar, Plus } from "lucide-react";
import { DeleteEventButton } from "./DeleteEventButton";
import { categoryLabel, formatEventDateShort, statusColor } from "@/lib/utils";

interface OrganizerEventsPageProps {
    searchParams: Promise<{
        status?: string;
    }>;
}

const STATUS_FILTERS = [
    { value: "all", label: "All" },
    { value: "published", label: "Published" },
    { value: "draft", label: "Draft" },
    { value: "cancelled", label: "Cancelled" },
    { value: "completed", label: "Completed" },
] as const;

export default async function OrganizerEventsPage({ searchParams }: OrganizerEventsPageProps) {
    const params = await searchParams;
    const organizerEvents = await getOrganizerEvents();

    const activeStatus = STATUS_FILTERS.some((f) => f.value === params.status)
        ? (params.status as (typeof STATUS_FILTERS)[number]["value"])
        : "all";

    const filteredEvents =
        activeStatus === "all"
            ? organizerEvents
            : organizerEvents.filter(({ event }) => event.status === activeStatus);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-semibold text-foreground">My Events</h1>
                    <p className="mt-1 text-muted-foreground">
                        {organizerEvents.length} event{organizerEvents.length !== 1 ? "s" : ""} created by you
                    </p>
                </div>
                <Link
                    href="/organizer/events/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    New Event
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
                            {filter.label}
                        </Link>
                    );
                })}
            </div>

            {filteredEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <Calendar className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 font-medium text-foreground">No events yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {activeStatus === "all"
                            ? "Create your first event to start receiving registrations."
                            : `No events found with status \"${activeStatus}\".`}
                    </p>
                    <Link
                        href="/organizer/events/new"
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="h-4 w-4" /> Create Event
                    </Link>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/50">
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registrations</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredEvents.map(({ event, attendeeCount }) => (
                                    <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium text-foreground">{event.title}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{categoryLabel(event.category)}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{formatEventDateShort(event.date)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(event.status)}`}>
                                                {event.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {attendeeCount ?? 0}
                                            {event.capacity ? ` / ${event.capacity}` : ""}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-3 text-xs">
                                                <Link href={`/events/${event.slug}`} className="text-primary hover:underline">
                                                    View
                                                </Link>
                                                <Link
                                                    href={`/organizer/events/${event.id}`}
                                                    className="text-blue-600 hover:underline dark:text-blue-400"
                                                >
                                                    Edit
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
