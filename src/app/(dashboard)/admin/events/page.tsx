import { db } from "@/lib/db";
import { events, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Calendar, Plus } from "lucide-react";
import { DeleteEventButton } from "./DeleteEventButton";

export default async function AdminEventsPage() {
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
        .orderBy(desc(events.createdAt));

    const statusColor: Record<string, string> = {
        published: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        draft: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
        cancelled: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
        completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-semibold text-foreground">All Events</h1>
                    <p className="mt-1 text-muted-foreground">
                        {allEvents.length} event{allEvents.length !== 1 ? "s" : ""} on the platform
                    </p>
                </div>
                <Link
                    href="/admin/events/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Create Event
                </Link>
            </div>

            {allEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <Calendar className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-4 font-medium text-foreground">No events yet</p>
                    <Link
                        href="/admin/events/new"
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="h-4 w-4" /> Create Event
                    </Link>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organizer</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {allEvents.map((event) => (
                                <tr key={event.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-medium text-foreground">{event.title}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{event.organizerName ?? "—"}</td>
                                    <td className="px-4 py-3 text-muted-foreground capitalize">{event.category}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {new Date(event.date).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[event.status] ?? ""}`}>
                                            {event.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-3 text-xs">
                                            <Link
                                                href={`/events/${event.slug}`}
                                                className="text-primary hover:underline"
                                            >
                                                View
                                            </Link>
                                            <Link
                                                href={`/admin/events/${event.id}`}
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
            )}
        </div>
    );
}
