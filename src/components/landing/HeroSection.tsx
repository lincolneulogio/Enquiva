import Link from "next/link";
import { ArrowRight, Compass, type LucideIcon } from "lucide-react";
import { BrandBadge } from "@/components/shared/BrandText";
import type { LandingCopy } from "@/lib/navigation/landing-audience";

interface HeroSectionProps {
  t: (key: string) => string;
  locale: string;
  copy: LandingCopy;
  /** Reservado: se muestra debajo del hero, no en el primer viewport. */
  signals?: Array<{
    icon: LucideIcon;
    value: string;
    label: string;
  }>;
  features: Array<{
    icon: LucideIcon;
    title: string;
    desc: string;
  }>;
}

/**
 * Primer viewport limpio: marca + headline + descripción + CTAs + plano visual.
 * Copy y CTAs dependen del rol (incl. invitado).
 */
export function HeroSection({ t, locale, copy, features }: HeroSectionProps) {
  const ctas = [copy.primaryCta, copy.secondaryCta].filter(
    (cta): cta is NonNullable<typeof cta> => Boolean(cta),
  );

  return (
    <section
      className="relative overflow-hidden px-4 pb-14 pt-16 sm:px-6 lg:pb-18 lg:pt-24"
      data-aos="fade-up"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="fe-gradient-mesh absolute inset-x-0 top-0 h-[680px]" />
        <div className="absolute left-1/2 top-0 h-[580px] w-[580px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-20 top-20 h-[320px] w-[320px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="text-center lg:text-left" data-aos="fade-right" data-aos-delay="80">
          <BrandBadge className="mb-6" />

          <h1 className="mb-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            {copy.heroTitleStart}{" "}
            <em className="bg-gradient-to-r from-primary to-accent bg-clip-text not-italic text-transparent">
              {copy.heroTitleHighlight}
            </em>
          </h1>

          <p className="mx-auto mb-9 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
            {copy.heroDescription}
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            {ctas.map((cta) =>
              cta.variant === "primary" ? (
                <Link
                  key={`${cta.href}-${cta.label}`}
                  href={cta.href}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-medium text-primary-foreground transition-all hover:gap-3 hover:bg-primary/90"
                >
                  {cta.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  key={`${cta.href}-${cta.label}`}
                  href={cta.href}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/80 px-8 py-3.5 font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  {cta.label}
                </Link>
              ),
            )}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl" data-aos="fade-left" data-aos-delay="140">
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/20 via-accent/10 to-transparent blur-3xl" />

          <div className="relative overflow-hidden rounded-none border-y border-border/80 bg-card/90 p-5 shadow-xl backdrop-blur-sm sm:rounded-[1.75rem] sm:border sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="font-display text-lg font-semibold text-foreground">Evora</p>
              <span className="inline-flex items-center rounded-full border border-border/80 bg-background/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {copy.audience === "guest"
                  ? locale === "en"
                    ? "Guest preview"
                    : "Vista invitado"
                  : "Live"}
              </span>
            </div>

            <div className="mb-4 rounded-2xl border border-border/80 bg-secondary/45 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("public.home.upcomingTitle")}
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {t("public.home.upcomingSubtitle")}
              </p>
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
