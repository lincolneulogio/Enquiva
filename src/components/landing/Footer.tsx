import Link from "next/link";
import { ArrowRight, ChevronUp } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { BrandText, PublicContactBlock, LegalLinks } from "@/components/shared/BrandText";

interface FooterProps {
  t: (key: string) => string;
}

export function Footer({ t }: FooterProps) {
  return (
    <footer
      className="px-4 pb-8 pt-4 sm:px-6"
      data-aos="fade-up"
      data-aos-delay="80"
    >
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[1.8rem] border border-border/88 bg-card/80 shadow-lg backdrop-blur-sm">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr] lg:gap-10 lg:p-10">
          <div>
            <BrandLogo href="/" size="sm" showText className="mb-4" />

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

            <PublicContactBlock />

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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <p>
              © {new Date().getFullYear()} <BrandText />. {t("public.home.footerBuilt")}
            </p>
            <LegalLinks
              termsLabel={t("public.home.footerTerms")}
              privacyLabel={t("public.home.footerPrivacy")}
              className="inline-flex flex-wrap items-center gap-x-2 gap-y-1"
            />
          </div>
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
  );
}
