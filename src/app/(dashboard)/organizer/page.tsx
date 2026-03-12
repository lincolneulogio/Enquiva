import { getOrganizerEvents } from "@/actions/events";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Plus, Calendar, Users, TrendingUp, Eye } from "lucide-react";
import { categoryLabel, formatEventDateShort, statusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default async function OrganizerDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const organizerEvents = await getOrganizerEvents();

  const totalAttendees = organizerEvents.reduce(
    (sum, { attendeeCount }) => sum + (attendeeCount ?? 0),
    0
  );
  const publishedCount = organizerEvents.filter(
    ({ event }) => event.status === "published"
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Welcome back, {session?.user.name?.split(" ")[0]} ✦
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your events and track attendance
          </p>
        </div>
        <Link
          href="/organizer/events/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Event
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Events",
            value: organizerEvents.length,
            icon: Calendar,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            label: "Published",
            value: publishedCount,
            icon: Eye,
            color: "text-green-600",
            bg: "bg-green-100 dark:bg-green-900/20",
          },
          {
            label: "Total Registrations",
            value: totalAttendees,
            icon: Users,
            color: "text-accent",
            bg: "bg-accent/10",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 font-display text-3xl font-semibold text-foreground">
                  {value}
                </p>
              </div>
              <div className={cn("rounded-xl p-3", bg)}>
                <Icon className={cn("h-5 w-5", color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Events Table */}
      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Your Events
          </h2>
        </div>
        {organizerEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-foreground">No events yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first event to get started
            </p>
            <Link
              href="/organizer/events/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> Create Event
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Event", "Date", "Category", "Status", "Registrations", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {organizerEvents.map(({ event, attendeeCount }) => (
                  <tr key={event.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground line-clamp-1">
                        {event.title}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {formatEventDateShort(event.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {categoryLabel(event.category)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium",
                          statusColor(event.status)
                        )}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {attendeeCount ?? 0}
                      {event.capacity ? ` / ${event.capacity}` : ""}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/organizer/events/${event.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
