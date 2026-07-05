import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight, Compass } from "lucide-react";

interface HeroSectionProps {
  t: (key: string) => string;
  locale: string;
  signals: Array<{
    icon: any;
    value: string;
    label: string;
  }>;
  features: Array<{
    icon: any;
    title: string;
    desc: string;
  }>;
}

export function HeroSection({ t, locale, signals, features }: HeroSectionProps) {
  return (
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
                <Image
                  src="/images/logo-mark-xs.png"
                  alt="Eventia"
                  width={18}
                  height={18}
                  className="h-[18px] w-auto object-contain"
                />
                Eventia
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
  );
}
