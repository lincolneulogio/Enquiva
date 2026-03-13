import Link from "next/link";
import { ArrowRight, Calendar, Users, Sparkles, Bell, Shield, Zap } from "lucide-react";
import { getPublicEvents } from "@/actions/events";
import { EventCard } from "@/components/events/EventCard";
import { PublicHeader } from "@/components/shared/PublicHeader";

export default async function HomePage() {
  const { events } = await getPublicEvents({ page: 1, limit: 6 });

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-28 text-center">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered event management for faith communities
          </div>
          <h1 className="mb-6 font-display text-5xl font-semibold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Bring Your Community{" "}
            <em className="not-italic text-primary">Together</em>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Discover, organize, and attend meaningful events. From worship nights
            to community retreats — FaithEvents makes it effortless to connect
            and grow together.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-medium text-primary-foreground hover:bg-primary/90 transition-all hover:gap-3"
            >
              Browse Events
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-3.5 font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Create an Account
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-secondary/30 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
              Everything you need to run great events
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Calendar,
                title: "Smart Event Management",
                desc: "Create, publish, and manage events with a powerful dashboard built for organizers.",
              },
              {
                icon: Users,
                title: "Attendee Registration",
                desc: "One-click registration with QR codes, waitlists, and real-time check-in tools.",
              },
              {
                icon: Sparkles,
                title: "AI-Powered Writing",
                desc: "Generate compelling event descriptions in seconds with our AI writing assistant.",
              },
              {
                icon: Bell,
                title: "Real-Time Notifications",
                desc: "Stay informed with instant updates via Pusher-powered live notifications.",
              },
              {
                icon: Shield,
                title: "Role-Based Access",
                desc: "Super Admins, Organizers, and Members — each with the right permissions.",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                desc: "Redis caching, optimistic UI, and Next.js 15 Server Actions for instant feedback.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      {events.length > 0 && (
        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
                  Upcoming Events
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Discover what&apos;s happening in the community
                </p>
              </div>
              <Link
                href="/events"
                className="hidden items-center gap-1 text-sm text-primary hover:underline sm:flex"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl rounded-3xl bg-primary px-8 py-16 text-center">
          <h2 className="font-display text-3xl font-semibold text-primary-foreground sm:text-4xl">
            Ready to build community?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Join thousands of community members discovering and attending events
            that matter.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-medium text-primary hover:bg-white/90 transition-colors"
          >
            Join FaithEvents <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} FaithEvents. Built with ❤️ for communities.</p>
      </footer>
    </div>
  );
}
