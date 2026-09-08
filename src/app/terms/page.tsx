import Link from "next/link";
import { CreditCard, QrCode, Cpu, type LucideIcon } from "lucide-react";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { ScrollToTopButton } from "@/components/shared/ScrollToTopButton";
import { Footer } from "@/components/landing/Footer";
import { TermsTabs, type TermsTabItem } from "@/components/landing/TermsTabs";
import { getStaticI18n } from "@/lib/i18n/server";
import { getPublicPageSectionsAction } from "@/actions/admin/pages";

export const revalidate = 120;

export const metadata = {
  title: "Términos y condiciones | Enquiva",
  description:
    "Términos y condiciones de uso de la plataforma Enquiva: cuentas, eventos, pagos, tickets y responsabilidades.",
};

type TermsSection = import("@/lib/db/schema").PageSection;

/* ------------------------------------------------------------------ */
/* Textos estructurales (chrome). Todo el contenido viene de la DB      */
/* (cláusulas en /superadmin/terms).                                    */
/* ------------------------------------------------------------------ */

const HERO_COPY = {
  badgeEs: "Marco normativo y operativo oficial",
  badgeEn: "Official regulatory & operating framework",
  titleAEs: "Términos y",
  titleAEn: "Terms and",
  titleAccentEs: "Condiciones de Uso",
  titleAccentEn: "Conditions of Use",
  descEs:
    "Conoce las pautas, derechos y responsabilidades que rigen el uso de nuestra plataforma de eventos. Operamos mediante pasarelas seguras y servicios especializados para organizaciones en Huánuco y todo el Perú.",
  descEn:
    "Learn the guidelines, rights and responsibilities governing the use of our event platform. We operate through secure gateways and specialized services for organizations in Huánuco and across Peru.",
};

const TABS_COPY = {
  eyebrowEs: "Índice del Contrato",
  eyebrowEn: "Contract Index",
  countEs: "Artículos",
  countEn: "Articles",
  emptyEs: "Estamos publicando el articulado. Vuelve pronto.",
  emptyEn: "We are publishing the articles. Check back soon.",
};

const CTA_COPY = {
  titleEs: "¿Listo para publicar o vivir tu próximo evento?",
  titleEn: "Ready to publish or experience your next event?",
  descEs: "Crea tu cuenta de organizador y vende tus entradas en la plataforma.",
  descEn: "Create your organizer account and sell your tickets on the platform.",
  primaryEs: "Explorar Eventos",
  primaryEn: "Explore Events",
  secondaryEs: "Crear Evento Gratis",
  secondaryEn: "Create Free Event",
};

function adminToTabs(sections: TermsSection[], isEn: boolean): TermsTabItem[] {
  return sections.map((s, i) => {
    const fallbackTitle = isEn ? `Clause ${i + 1}` : `Cláusula ${i + 1}`;
    const body =
      (isEn ? s.bodyEn : s.bodyEs) ??
      (isEn ? s.subtitleEn : s.subtitleEs) ??
      "";
    const subtitle = `${s.subtitleEs ?? ""} ${s.subtitleEn ?? ""}`.toLowerCase();
    return {
      id: s.id,
      num: String(i + 1).padStart(2, "0"),
      title: (isEn ? s.titleEn : s.titleEs) ?? fallbackTitle,
      html: body,
      contact: subtitle.includes("contacto") || subtitle.includes("contact"),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Piezas de UI                                                        */
/* ------------------------------------------------------------------ */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
      {children}
    </p>
  );
}

function HeroSection({ isEn }: { isEn: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl dark:bg-primary/10" />
      </div>
      <div className="relative mx-auto max-w-3xl px-4 pb-4 pt-12 text-center sm:px-6 sm:pt-16">
        <Eyebrow>{isEn ? HERO_COPY.badgeEn : HERO_COPY.badgeEs}</Eyebrow>
        <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {isEn ? HERO_COPY.titleAEn : HERO_COPY.titleAEs}{" "}
          <span className="text-primary">
            {isEn ? HERO_COPY.titleAccentEn : HERO_COPY.titleAccentEs}
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {isEn ? HERO_COPY.descEn : HERO_COPY.descEs}
        </p>
      </div>
    </section>
  );
}

const SUMMARY_ICONS: LucideIcon[] = [Cpu, CreditCard, QrCode];

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function SummaryCards({ tabs, isEn }: { tabs: TermsTabItem[]; isEn: boolean }) {
  const cards = tabs.slice(0, 3);
  if (cards.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 pb-2 pt-10 sm:px-6 sm:pt-12">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((tab, i) => {
          const Icon = SUMMARY_ICONS[i % SUMMARY_ICONS.length] ?? Cpu;
          const plain = stripHtml(tab.html ?? "");
          const desc = plain.length > 150 ? `${plain.slice(0, 150).trimEnd()}…` : plain;
          return (
            <article
              key={tab.id}
              className="rounded-2xl border border-primary/15 bg-white p-5 shadow-sm dark:border-border dark:bg-card sm:p-6"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <h2 className="mt-4 font-display text-base font-bold text-foreground">
                {tab.title}
              </h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {desc}
              </p>
              <p className="mt-4 text-[11px] font-semibold text-primary">
                {isEn ? "Article" : "Artículo"} {tab.num} →
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ContractTabs({ tabs, isEn }: { tabs: TermsTabItem[]; isEn: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-2 pt-10 sm:px-6 sm:pt-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <Eyebrow>{isEn ? TABS_COPY.eyebrowEn : TABS_COPY.eyebrowEs}</Eyebrow>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {tabs.length} {isEn ? TABS_COPY.countEn : TABS_COPY.countEs}
        </p>
      </div>
      <div className="mt-4">
        <TermsTabs
          tabs={tabs}
          isEn={isEn}
          emptyLabel={isEn ? TABS_COPY.emptyEn : TABS_COPY.emptyEs}
        />
      </div>
    </section>
  );
}

function CtaBanner({ isEn }: { isEn: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-12">
      <div className="flex flex-col gap-5 rounded-2xl bg-foreground p-6 text-background shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between dark:border dark:border-border">
        <div>
          <h2 className="font-display text-xl font-bold sm:text-2xl">
            {isEn ? CTA_COPY.titleEn : CTA_COPY.titleEs}
          </h2>
          <p className="mt-1 text-[13px] opacity-80">
            {isEn ? CTA_COPY.descEn : CTA_COPY.descEs}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/events"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-background px-5 py-3 text-sm font-bold text-foreground transition-colors hover:opacity-90"
          >
            {isEn ? CTA_COPY.primaryEn : CTA_COPY.primaryEs}
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            {isEn ? CTA_COPY.secondaryEn : CTA_COPY.secondaryEs}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default async function TermsPage() {
  const { locale } = await getStaticI18n();
  const isEn = locale === "en";

  let sections: TermsSection[];
  try {
    sections = await getPublicPageSectionsAction("terms");
  } catch {
    sections = [];
  }

  const adminSections = (sections ?? []).filter((s) => s.kind === "section");
  const tabs = adminToTabs(adminSections, isEn);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <HeroSection isEn={isEn} />
      <SummaryCards tabs={tabs} isEn={isEn} />
      <ContractTabs tabs={tabs} isEn={isEn} />
      <CtaBanner isEn={isEn} />
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}
