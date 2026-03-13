import Link from "next/link";
import { ArrowRight, Calendar, Users, Sparkles, Bell, Shield, Zap } from "lucide-react";
import { getPublicEvents } from "@/actions/events";
import { EventCard } from "@/components/events/EventCard";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { getI18n } from "@/lib/i18n/server";

export default async function HomePage() {
  const { t } = await getI18n();
  const { events } = await getPublicEvents({ page: 1, limit: 6 });
  const features = [
    {
      icon: Calendar,
      title: t("public.home.features.smartManagementTitle"),
      desc: t("public.home.features.smartManagementDesc"),
    },
    {
      icon: Users,
      title: t("public.home.features.attendeeRegistrationTitle"),
      desc: t("public.home.features.attendeeRegistrationDesc"),
    },
    {
      icon: Sparkles,
      title: t("public.home.features.aiWritingTitle"),
      desc: t("public.home.features.aiWritingDesc"),
    },
    {
      icon: Bell,
      title: t("public.home.features.realtimeNotificationsTitle"),
      desc: t("public.home.features.realtimeNotificationsDesc"),
    },
    {
      icon: Shield,
      title: t("public.home.features.roleBasedAccessTitle"),
      desc: t("public.home.features.roleBasedAccessDesc"),
    },
    {
      icon: Zap,
      title: t("public.home.features.lightningFastTitle"),
      desc: t("public.home.features.lightningFastDesc"),
    },
  ];

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
            {t("public.home.badge")}
          </div>
          <h1 className="mb-6 font-display text-5xl font-semibold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            {t("public.home.heroTitleStart")}{" "}
            <em className="not-italic text-primary">{t("public.home.heroTitleHighlight")}</em>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            {t("public.home.heroDescription")}
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-medium text-primary-foreground hover:bg-primary/90 transition-all hover:gap-3"
            >
              {t("public.home.browseEvents")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-3.5 font-medium text-foreground hover:bg-secondary transition-colors"
            >
              {t("public.home.createAccount")}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-secondary/30 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
              {t("public.home.featuresTitle")}
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
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
                  {t("public.home.upcomingTitle")}
                </h2>
                <p className="mt-1 text-muted-foreground">
                  {t("public.home.upcomingSubtitle")}
                </p>
              </div>
              <Link
                href="/events"
                className="hidden items-center gap-1 text-sm text-primary hover:underline sm:flex"
              >
                {t("public.home.viewAll")} <ArrowRight className="h-3.5 w-3.5" />
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
            {t("public.home.ctaTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            {t("public.home.ctaDescription")}
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-medium text-primary hover:bg-white/90 transition-colors"
          >
            {t("public.home.ctaButton")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} FaithEvents. {t("public.home.footerBuilt")}</p>
      </footer>
    </div>
  );
}
