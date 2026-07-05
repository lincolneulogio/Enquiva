import Link from "next/link";
import Image from "next/image";
import { Users, Globe2 } from "lucide-react";

interface FeaturesSectionProps {
  t: (key: string) => string;
  locale: string;
}

export function FeaturesSection({ t, locale }: FeaturesSectionProps) {
  return (
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
                  Eventia Comunidad
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
  );
}
