import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Database,
  EyeOff,
  type LucideIcon,
} from "lucide-react";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { ScrollToTopButton } from "@/components/shared/ScrollToTopButton";
import { Footer } from "@/components/landing/Footer";
import { TermsTabs, type TermsTabItem } from "@/components/landing/TermsTabs";
import { getStaticI18n } from "@/lib/i18n/server";
import { getPublicPageSectionsAction } from "@/actions/admin/pages";
import { BRAND } from "@/lib/brand";

export const revalidate = 120;

export const metadata = {
  title: "Política de privacidad | Enquiva",
  description:
    "Cómo Enquiva recopila, usa y protege tu información personal, tus datos de pago y tu actividad en la plataforma.",
};

type PrivacySection = import("@/lib/db/schema").PageSection;

/* ------------------------------------------------------------------ */
/* Textos estructurales (chrome). Todo el contenido viene de la DB      */
/* (cláusulas en /superadmin/privacy).                                  */
/* ------------------------------------------------------------------ */

const HERO_COPY = {
  badgeEs: "Marco de privacidad y datos oficiales",
  badgeEn: "Official privacy & data framework",
  titleAEs: "Política de Privacidad y",
  titleAEn: "Privacy Policy and",
  titleAccentEs: "Protección de Datos",
  titleAccentEn: "Data Protection",
  descEs:
    "Cómo Enquiva cuida, administra y protege la información confidencial de asistentes y organizadores, con estándares de seguridad y transparencia legal.",
  descEn:
    "How Enquiva cares for, manages and protects the confidential information of attendees and organizers, with security standards and legal transparency.",
};

const TABS_COPY = {
  eyebrowEs: "Índice de Privacidad",
  eyebrowEn: "Privacy Index",
  countEs: "Artículos",
  countEn: "Articles",
  emptyEs: "Estamos publicando el articulado. Vuelve pronto.",
  emptyEn: "We are publishing the articles. Check back soon.",
};

const BANNER_COPY = {
  eyebrowEs: "Transparencia y seguridad total",
  eyebrowEn: "Full transparency & security",
  titleEs: "¿Tienes consultas adicionales sobre tu privacidad?",
  titleEn: "Any further questions about your privacy?",
  descEs: "Escríbenos y te ayudamos a proteger tus datos en cada evento.",
  descEn: "Write to us and we will help you protect your data at every event.",
  primaryEs: "Consultar DPO",
  primaryEn: "Consult DPO",
  secondaryEs: "Ver Términos y Condiciones",
  secondaryEn: "See Terms & Conditions",
};

function adminToTabs(sections: PrivacySection[], isEn: boolean): TermsTabItem[] {
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

const PRINCIPLE_ICONS: LucideIcon[] = [Database, EyeOff, BadgeCheck];

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function PrinciplesSection({ tabs, isEn }: { tabs: TermsTabItem[]; isEn: boolean }) {
  const cards = tabs.slice(0, 3);
  if (cards.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 pb-2 pt-10 sm:px-6 sm:pt-12">
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((tab, i) => {
          const Icon = PRINCIPLE_ICONS[i % PRINCIPLE_ICONS.length] ?? Database;
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
                {isEn ? "Article" : "Artículo"} {tab.num}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PrivacyTabs({ tabs, isEn }: { tabs: TermsTabItem[]; isEn: boolean }) {
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
          listLabelEs="Índice de privacidad"
          listLabelEn="Privacy index"
        />
      </div>
    </section>
  );
}

function CtaBanner({ isEn }: { isEn: boolean }) {
  const email = BRAND.contactEmail;
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-12">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-primary/5 to-card p-6 shadow-sm dark:border-border dark:from-primary/10 dark:via-card dark:to-card sm:p-8">
        <Eyebrow>{isEn ? BANNER_COPY.eyebrowEn : BANNER_COPY.eyebrowEs}</Eyebrow>
        <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
              {isEn ? BANNER_COPY.titleEn : BANNER_COPY.titleEs}
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {isEn ? BANNER_COPY.descEn : BANNER_COPY.descEs}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              {isEn ? BANNER_COPY.primaryEn : BANNER_COPY.primaryEs}
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/terms"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-primary/5"
            >
              {isEn ? BANNER_COPY.secondaryEn : BANNER_COPY.secondaryEs}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default async function PrivacyPage() {
  const { locale } = await getStaticI18n();
  const isEn = locale === "en";

  let sections: PrivacySection[];
  try {
    sections = await getPublicPageSectionsAction("privacy");
  } catch {
    sections = [];
  }

  const adminSections = (sections ?? []).filter((s) => s.kind === "section");
  const tabs = adminToTabs(adminSections, isEn);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <HeroSection isEn={isEn} />
      <PrinciplesSection tabs={tabs} isEn={isEn} />
      <PrivacyTabs tabs={tabs} isEn={isEn} />
      <CtaBanner isEn={isEn} />
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}
