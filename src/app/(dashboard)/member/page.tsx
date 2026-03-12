import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getPublicEvents } from "@/actions/events";
import { getUserRegistrations } from "@/actions/registrations";
import { EventCard } from "@/components/events/EventCard";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";

export default async function MemberDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const [{ events: upcomingEvents }, myRegistrations] = await Promise.all([
    getPublicEvents({ limit: 3 }),
    getUserRegistrations(),
  ]);

  const activeRegistrations = myRegistrations.filter(
    ({ registration }) =>
      registration.status === "registered" || registration.status === "checked_in"
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Hello, {session?.user.name?.split(" ")[0]} ✦
        </h1>
        <p className="mt-1 text-muted-foreground">
          Discover events and stay connected with your community
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/member/payments"
          className="rounded-2xl border border-border bg-card p-5 text-sm font-semibold text-foreground hover:border-primary hover:shadow-lg transition"
        >
          Review payments &amp; receipts
        </Link>
        <Link
          href="/member/tickets"
          className="rounded-2xl border border-border bg-card p-5 text-sm font-semibold text-foreground hover:border-primary hover:shadow-lg transition"
        >
          View your tickets
        </Link>
      </div>

      {/* My Upcoming Events */}
      {activeRegistrations.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Your Upcoming Events
            </h2>
            <Link
              href="/member/events"
              className="text-sm text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeRegistrations.slice(0, 3).map(({ event, registration }) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-medium text-foreground text-sm">
                    {event.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(event.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    {registration.status === "checked_in" ? "Checked In" : "Registered"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Discover Events */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Discover Events
          </h2>
          <Link
            href="/events"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Browse all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {upcomingEvents.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <span className="mb-3 text-5xl opacity-20">✦</span>
            <p className="font-medium text-foreground">No events yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Check back later for upcoming events
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
