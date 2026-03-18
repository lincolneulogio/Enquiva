import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Users,
  Sparkles,
  Bell,
  Shield,
  Zap,
  Radio,
  Compass,
  ArrowUpRight,
} from "lucide-react";
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

  const signals = [
    { icon: Calendar, value: "24/7", label: t("common.overview") },
    { icon: Users, value: "10k+", label: t("common.registrations") },
    { icon: Bell, value: "Live", label: t("common.notifications") },
    { icon: Shield, value: "RBAC", label: t("public.home.features.roleBasedAccessTitle") },
  ];

  const featureCardVariants = [
    "min-h-[250px] bg-card/95",
    "min-h-[300px] bg-gradient-to-b from-card to-secondary/35",
    "min-h-[260px] bg-card/95",
    "min-h-[280px] bg-gradient-to-b from-card to-primary/5",
    "min-h-[240px] bg-card/95",
  ];

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      <PublicHeader />

      {/* Hero */}
      <section
        className="relative overflow-hidden px-4 pb-16 pt-16 sm:px-6 lg:pb-20 lg:pt-24"
        data-aos="fade-up"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="fe-gradient-mesh absolute inset-x-0 top-0 h-[680px]" />
          <div className="absolute left-1/2 top-0 h-[580px] w-[580px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-20 top-20 h-[320px] w-[320px] rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
          <div className="text-center lg:text-left" data-aos="fade-right" data-aos-delay="80">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-background/70 px-4 py-1.5 text-sm text-primary shadow-sm backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {t("public.home.badge")}
            </div>

            <h1 className="mb-6 font-display text-5xl font-semibold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              {t("public.home.heroTitleStart")}{" "}
              <em className="bg-gradient-to-r from-primary to-accent bg-clip-text not-italic text-transparent">
                {t("public.home.heroTitleHighlight")}
              </em>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
              {t("public.home.heroDescription")}
            </p>

            <div className="mb-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-medium text-primary-foreground transition-all hover:gap-3 hover:bg-primary/90"
              >
                {t("public.home.browseEvents")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/80 px-8 py-3.5 font-medium text-foreground transition-colors hover:bg-secondary"
              >
                {t("public.home.createAccount")}
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {signals.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border/70 bg-card/85 px-4 py-3 text-left shadow-sm backdrop-blur-sm"
                >
                  <div className="mb-2 flex items-center gap-2 text-primary">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {label}
                    </span>
                  </div>
                  <p className="font-display text-2xl font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl" data-aos="fade-left" data-aos-delay="140">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/20 via-accent/10 to-transparent blur-3xl" />

            <div className="relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-card/90 p-5 shadow-xl backdrop-blur-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Radio className="h-3.5 w-3.5" />
                  FaithEvents Pulse
                </span>
                <span className="text-xs text-muted-foreground">Live</span>
              </div>

              <div className="mb-4 rounded-2xl border border-border/80 bg-secondary/45 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("public.home.upcomingTitle")}</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{t("public.home.upcomingSubtitle")}</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-primary">
                  <Compass className="h-4 w-4" />
                  <span>{t("common.browseEvents")}</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {features.slice(0, 4).map(({ icon: Icon, title }, index) => (
                  <div
                    key={title}
                    className="fe-float rounded-xl border border-border/80 bg-background/90 p-3"
                    style={{ animationDelay: `${index * 0.18}s` }}
                  >
                    <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="line-clamp-2 text-sm font-medium text-foreground">{title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Signals strip */}
      <section className="px-4 py-8 sm:px-6" data-aos="fade-up" data-aos-delay="60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-border/80 bg-card/70 p-3 backdrop-blur-sm">
          {signals.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm"
            >
              <Icon className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">{value}</span>
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      {events.length > 0 && (
        <section className="px-4 pb-20 pt-10 sm:px-6" data-aos="fade-up" data-aos-delay="80">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex items-center justify-between gap-4">
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
                className="hidden items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-primary transition-colors hover:bg-secondary sm:flex"
              >
                {t("public.home.viewAll")} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 sm:justify-items-stretch lg:grid-cols-3">
              {events.map((event, index) => (
                <div
                  key={event.id}
                  className="w-full max-w-md sm:max-w-none"
                  data-aos="zoom-in-up"
                  data-aos-delay={String(70 + index * 60)}
                >
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6" data-aos="fade-up" data-aos-delay="120">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary via-primary to-accent px-8 py-16 text-center shadow-xl">
          <h2 className="font-display text-3xl font-semibold text-primary-foreground sm:text-4xl">
            {t("public.home.ctaTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            {t("public.home.ctaDescription")}
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-medium text-primary transition-colors hover:bg-white/90"
          >
            {t("public.home.ctaButton")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground"
        data-aos="fade-up"
        data-aos-delay="80"
      >
        <p>© {new Date().getFullYear()} FaithEvents. {t("public.home.footerBuilt")}</p>
      </footer>
    </div>
  );
}
