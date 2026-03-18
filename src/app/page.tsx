import Link from "next/link";
import Image from "next/image";
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
  Globe2,
  Facebook,
  Mail,
  MapPin,
  ChevronUp,
} from "lucide-react";
import { getPublicEvents } from "@/actions/events";
import { EventCard } from "@/components/events/EventCard";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { getI18n } from "@/lib/i18n/server";

export default async function HomePage() {
  const { locale, t } = await getI18n();
  const { events, totalRegistrations } = await getPublicEvents({ page: 1, limit: 6 });

  const formattedRegistrations = new Intl.NumberFormat(
    locale === "en" ? "en-US" : "es-PE"
  ).format(totalRegistrations);

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
    { icon: Users, value: formattedRegistrations, label: t("common.registrations") },
    { icon: Bell, value: "Live", label: t("common.notifications") },
    { icon: Shield, value: "RBAC", label: t("public.home.features.roleBasedAccessTitle") },
  ];

  return (
    <div id="top" className="relative min-h-screen overflow-x-clip bg-background">
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
                  Encuentro de Fe
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

      {/* About / Who we are */}
      <section className="bg-secondary/45 px-4 py-20 sm:px-6" data-aos="fade-up" data-aos-delay="100">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center gap-2 text-[0.95rem] font-semibold uppercase tracking-wide text-[#8a3e13]">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#f97316]" />
            {t("public.home.aboutEyebrow")}
          </div>

          <div className="overflow-hidden rounded-[1.8rem] border border-border/70 bg-card shadow-lg">
            <div className="grid lg:grid-cols-2">
              <div className="p-7 sm:p-10 lg:p-12">
                <h2 className="max-w-lg font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
                  {t("public.home.aboutTitleStart")} {" "}
                  <em className="not-italic text-[#f97316]">{t("public.home.aboutTitleHighlight")}</em>
                </h2>

                <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                  {t("public.home.aboutDescription")}
                </p>

                <Link
                  href="/register"
                  className="mt-8 inline-flex min-w-40 items-center justify-center rounded-xl border border-[#f39a5f] px-6 py-3 font-medium text-[#da6e27] transition-colors hover:bg-[#fff2e8]"
                >
                  {t("public.home.aboutButton")}
                </Link>
              </div>

              <div className="relative min-h-[330px] overflow-hidden bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 p-6 sm:min-h-[380px] sm:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.75),transparent_35%),radial-gradient(circle_at_80%_75%,rgba(249,115,22,0.20),transparent_40%)]" />

                <div className="pointer-events-none absolute -right-8 -top-10 z-20 hidden w-[220px] rotate-6 rounded-2xl border border-white/70 bg-white/90 p-1 shadow-2xl sm:block lg:w-[260px]">
                  <Image
                    src="/images/community-card-illustration.svg"
                    alt={t("public.home.aboutImageAlt")}
                    width={260}
                    height={188}
                    className="h-auto w-full rounded-xl"
                  />
                </div>

                <div className="relative z-10 flex h-full flex-col justify-between rounded-3xl border border-white/60 bg-white/45 p-5 backdrop-blur-md sm:p-6">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-medium text-[#9a4d1e]">
                    <Users className="h-3.5 w-3.5" />
                    Encuentro de Fe Comunidad
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/70 bg-white/80 p-3.5 text-sm text-[#7a3f18] shadow-sm sm:p-4">
                      <div className="mb-1.5 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-[#a45622]">
                        <Globe2 className="h-3.5 w-3.5" />
                        {t("public.home.aboutStatTitle")}
                      </div>
                      <p className="font-medium text-[#713814]">{t("public.home.aboutStatDescription")}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        t("public.home.aboutChipFaith"),
                        t("public.home.aboutChipFamily"),
                        t("public.home.aboutChipHope"),
                      ].map((chip) => (
                        <div
                          key={chip}
                          className="rounded-xl border border-white/70 bg-white/85 px-2 py-2 text-center text-xs font-medium text-[#8b4318]"
                        >
                          {chip}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-4 pb-8 pt-4 sm:px-6"
        data-aos="fade-up"
        data-aos-delay="80"
      >
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[1.8rem] border border-border/80 bg-card/80 shadow-lg backdrop-blur-sm">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr] lg:gap-10 lg:p-10">
            <div>
              <div className="mb-4 inline-flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">✦</div>
                <span className="font-display text-lg font-semibold text-foreground">Encuentro de Fe</span>
              </div>

              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                {t("public.home.footerTagline")}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {["24/7", "Live", "Comunidad"].map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-border/80 bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">
                {t("public.home.footerExploreTitle")}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/events" className="transition-colors hover:text-foreground">
                    {t("common.browseEvents")}
                  </Link>
                </li>
                <li>
                  <Link href="/events" className="transition-colors hover:text-foreground">
                    {t("public.home.upcomingTitle")}
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="transition-colors hover:text-foreground">
                    {t("public.home.createAccount")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">
                {t("public.home.footerAccountTitle")}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/login" className="transition-colors hover:text-foreground">
                    {t("common.signIn")}
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="transition-colors hover:text-foreground">
                    {t("common.getStarted")}
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="transition-colors hover:text-foreground">
                    {t("common.goToDashboard")}
                  </Link>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 sm:p-5">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
                {t("public.home.footerContactTitle")}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">{t("public.home.footerContactDescription")}</p>

              <div className="space-y-2.5 text-sm">
                <a
                  href="mailto:hola@EncuentroDeFe.app"
                  className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Mail className="h-4 w-4 text-primary" />
                  hola@EncuentroDeFe.app
                </a>
                <p className="inline-flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  Huánuco, Perú
                </p>
                <a
                  href="https://www.facebook.com/lincolneulogio"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Facebook className="h-4 w-4 text-primary" />
                  facebook.com/lincolneulogio
                </a>
              </div>

              <Link
                href="/register"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("public.home.ctaButton")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/80 bg-background/70 px-6 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <p>© {new Date().getFullYear()} EncuentroDeFe. {t("public.home.footerBuilt")}</p>
            <Link
              href="#top"
              className="inline-flex items-center gap-1 self-start rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary sm:self-auto"
            >
              <ChevronUp className="h-3.5 w-3.5" />
              {t("public.home.footerBackToTop")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
