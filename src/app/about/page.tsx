import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  Eye,
  Heart,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Rocket,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { ScrollToTopButton } from "@/components/shared/ScrollToTopButton";
import { Footer } from "@/components/landing/Footer";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { getStaticI18n } from "@/lib/i18n/server";
import { getPublicPageSectionsAction } from "@/actions/admin/pages";
import { db } from "@/lib/db";
import { count, ne } from "drizzle-orm";
import { events, registrations } from "@/lib/db/schema";
import { getSystemSettings } from "@/lib/settings/settings-db";
import { BRAND } from "@/lib/brand";
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/url";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Sobre Nosotros",
  description:
    "Conoce a Enquiva: la plataforma de gestión de eventos de Huánuco y todo el Perú. Nuestra misión, visión y el equipo que impulsa la evolución de la industria de eventos desde Huánuco hacia todo el país.",
  keywords: ["Enquiva", "sobre nosotros", "equipo Enquiva", "plataforma de eventos Huánuco", "misión", "visión"],
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    locale: "es_PE",
    url: absoluteUrl("/about"),
    title: "Sobre Nosotros | Enquiva",
    description:
      "Conoce a Enquiva: la plataforma de gestión de eventos de Huánuco y todo el Perú.",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "Sobre Enquiva" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sobre Nosotros | Enquiva",
    description: "Conoce a Enquiva: la plataforma de gestión de eventos de Huánuco y todo el Perú.",
  },
};

type AboutSection = import("@/lib/db/schema").PageSection;

/* ------------------------------------------------------------------ */
/* Textos estructurales (chrome). Todo el contenido viene de la DB      */
/* (secciones en /superadmin/about).                                    */
/* ------------------------------------------------------------------ */

const HERO_BADGE = {
  badgeEs: "Conoce nuestra historia · Equipo Enquiva",
  badgeEn: "Meet our story · Enquiva team",
};

const STAT_ICONS: LucideIcon[] = [MapPin, Ticket, ShieldCheck, BadgeCheck];

const PRINCIPLE_SLOTS: Array<{
  key: string;
  icon: LucideIcon;
  eyebrowEs: string;
  eyebrowEn: string;
}> = [
  { key: "mission", icon: Rocket, eyebrowEs: "Propósito central", eyebrowEn: "Core purpose" },
  { key: "vision", icon: Eye, eyebrowEs: "Hacia el futuro", eyebrowEn: "Toward the future" },
  { key: "values", icon: Heart, eyebrowEs: "Código de conducta", eyebrowEn: "Code of conduct" },
];

const PRINCIPLES_HEADER = {
  eyebrowEs: "Nuestros cimientos",
  eyebrowEn: "Our foundations",
  titleEs: "Principios que impulsan nuestra arquitectura",
  titleEn: "Principles that drive our architecture",
  sideEs:
    "Diseñamos soluciones pragmáticas que devuelven la soberanía y la previsibilidad financiera a los productores de eventos en toda la región.",
  sideEn:
    "We design pragmatic solutions that give sovereignty and financial predictability back to event producers across the region.",
};

const TEAM_COPY = {
  eyebrowEs: "Nuestra trayectoria y talento",
  eyebrowEn: "Our journey and talent",
  titleEs: "El equipo que hace posible cada evento",
  titleEn: "The team behind every event",
  descEs:
    "Un grupo apasionado de ingenieros, diseñadores y estrategas que impulsan la evolución continua de Enquiva paso a paso, desde Huánuco hacia todo el Perú regional.",
  descEn:
    "A passionate group of engineers, designers, and strategists driving Enquiva's continuous evolution step by step, from Huánuco to all of regional Peru.",
  milestoneEs: "Hito",
  milestoneEn: "Milestone",
  memberTagEs: "Enquiva · Equipo",
  memberTagEn: "Enquiva · Team",
  emptyEs: "Estamos publicando los perfiles del equipo. Vuelve pronto.",
  emptyEn: "We are publishing the team profiles. Check back soon.",
};

/* Traducción de roles curados de miembros del equipo (usados por la DB). */
const TEAM_ROLE_TRANSLATIONS: Record<string, { es: string; en: string }> = {
  "Directora Ejecutiva": { es: "Directora Ejecutiva", en: "Executive Director" },
  "Director Ejecutivo": { es: "Director Ejecutivo", en: "Executive Director" },
  "Director de Operaciones": { es: "Director de Operaciones", en: "Operations Director" },
  "Líder de Comunidad": { es: "Líder de Comunidad", en: "Community Lead" },
};

const TALENT_COPY = {
  eyebrowEs: "Talento & comunidad",
  eyebrowEn: "Talent & community",
  titleEs: "¿Quieres sumarte a nuestra misión?",
  titleEn: "Want to join our mission?",
  descEs:
    "Buscamos constantemente mentes talentosas en ingeniería de software, producto, soporte y operaciones que quieran revolucionar la industria de eventos desde Huánuco hacia todo el país. Conoce nuestras vacantes abiertas o escríbenos directamente.",
  descEn:
    "We are constantly looking for talented minds in software engineering, product, support, and operations who want to revolutionize the events industry from Huánuco to the whole country. See our open roles or write to us directly.",
  primaryEs: "Ver vacantes abiertas",
  primaryEn: "See open roles",
  secondaryEs: "Escríbenos a",
  secondaryEn: "Write to us at",
};

const CONTACT_BANNER = {
  pillEs: "Soporte dedicado 24/7",
  pillEn: "24/7 dedicated support",
  titleEs: "¿Tienes dudas o ideas para tu próximo evento?",
  titleEn: "Questions or ideas for your next event?",
  descEs: "Escríbenos y te ayudamos a organizar tu evento.",
  descEn: "Write to us and we will help you organize your event.",
  cityEs: "Huánuco, Perú",
  cityEn: "Huánuco, Peru",
  writeEs: "Escribir mensaje",
  writeEn: "Write a message",
  callEs: "Llamar a Enquiva",
  callEn: "Talk to Enquiva",
};

/* ------------------------------------------------------------------ */
/* Piezas de UI                                                        */
/* ------------------------------------------------------------------ */

function Eyebrow({ icon: Icon, children }: { icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary dark:bg-primary/10 dark:text-primary">
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {children}
    </p>
  );
}

function HeroSection({
  hero,
  isEn,
}: {
  hero: AboutSection | null;
  isEn: boolean;
}) {
  const customTitle = isEn ? hero?.titleEn : hero?.titleEs;
  const customDesc = isEn ? hero?.subtitleEn : hero?.subtitleEs;

  if (!hero || (!customTitle && !customDesc && !hero.imageUrl)) return null;

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl dark:bg-primary/10" />
      </div>
      <div className="relative mx-auto max-w-3xl px-4 pb-4 pt-12 text-center sm:px-6 sm:pt-16">
        <Eyebrow icon={Sparkles}>
          {isEn ? HERO_BADGE.badgeEn : HERO_BADGE.badgeEs}
        </Eyebrow>
        {customTitle ? (
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {customTitle}
          </h1>
        ) : null}
        {customDesc ? (
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {customDesc}
          </p>
        ) : null}
        {hero?.imageUrl ? (
          <div className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-2xl border border-primary/15 bg-white shadow-sm dark:border-border">
            <img
              src={hero.imageUrl}
              alt={customTitle ?? "Enquiva"}
              className="h-auto w-full object-cover"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function StatsRow({ stats, isEn }: { stats: AboutSection[]; isEn: boolean }) {
  if (stats.length === 0) return null;
  const items = stats.map((s, i) => ({
    icon: STAT_ICONS[i % STAT_ICONS.length] ?? BadgeCheck,
    label: (isEn ? s.titleEn : s.titleEs) ?? ((isEn ? s.titleEs : s.titleEn) ?? "—"),
    value: (isEn ? s.subtitleEn : s.subtitleEs) ?? ((isEn ? s.subtitleEs : s.subtitleEn) ?? "—"),
    text: (isEn ? s.bodyEn : s.bodyEs) ?? ((isEn ? s.bodyEs : s.bodyEn) ?? ""),
  }));

  return (
    <section className="mx-auto max-w-5xl px-4 pb-2 pt-12 sm:px-6 sm:pt-14">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map(({ icon: Icon, label, value, text }) => (
          <article
            key={label}
            className="rounded-2xl border border-primary/15 bg-white p-4 shadow-sm dark:border-border dark:bg-card"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function pickPrinciple(
  sections: AboutSection[],
  matchers: string[],
  fallbackIndex: number,
  used: Set<string>,
): AboutSection | null {
  const direct = sections.find(
    (s) =>
      !used.has(s.id) &&
      `${s.titleEs ?? ""} ${s.titleEn ?? ""}`.toLowerCase().includes(matchers[0]),
  );
  if (direct) {
    used.add(direct.id);
    return direct;
  }
  const ordered = sections.filter((s) => !used.has(s.id));
  const next = ordered[fallbackIndex] ?? ordered[0] ?? null;
  if (next) used.add(next.id);
  return next;
}

function PrincipleCard({
  icon: Icon,
  eyebrow,
  title,
  body,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string | null | undefined;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-primary/15 bg-white p-5 shadow-sm dark:border-border dark:bg-card sm:p-6">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {eyebrow}
      </p>
      <h3 className="mt-1 font-display text-lg font-bold text-foreground">{title}</h3>
      {body ? (
        <div className="mt-2 flex-1 text-[13px] leading-relaxed text-muted-foreground [&>p+ p]:mt-2">
          <RichTextContent content={body} />
        </div>
      ) : null}
    </article>
  );
}

function PrinciplesSection({
  sections,
  isEn,
}: {
  sections: AboutSection[];
  isEn: boolean;
}) {
  const used = new Set<string>();
  const mission = pickPrinciple(sections, ["misi", "mission"], 0, used);
  const vision = pickPrinciple(sections, ["visi", "vision"], 0, used);
  const values = pickPrinciple(sections, ["valor", "value"], 0, used);
  const leftovers = sections.filter((s) => !used.has(s.id));

  const cards = [
    { slot: PRINCIPLE_SLOTS[0]!, section: mission },
    { slot: PRINCIPLE_SLOTS[1]!, section: vision },
    { slot: PRINCIPLE_SLOTS[2]!, section: values },
  ].filter((c) => c.section);

  if (cards.length === 0 && leftovers.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-4 pb-4 pt-16 sm:px-6 sm:pt-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow icon={Sparkles}>
            {isEn ? PRINCIPLES_HEADER.eyebrowEn : PRINCIPLES_HEADER.eyebrowEs}
          </Eyebrow>
          <h2 className="mt-3 max-w-md font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {isEn ? PRINCIPLES_HEADER.titleEn : PRINCIPLES_HEADER.titleEs}
          </h2>
        </div>
        <p className="max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          {isEn ? PRINCIPLES_HEADER.sideEn : PRINCIPLES_HEADER.sideEs}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {cards.map(({ slot, section }) => (
          <PrincipleCard
            key={slot.key}
            icon={slot.icon}
            eyebrow={isEn ? slot.eyebrowEn : slot.eyebrowEs}
            title={
              (isEn ? section?.titleEn : section?.titleEs) ||
              (isEn ? section?.titleEs : section?.titleEn) ||
              ""
            }
            body={
              (isEn ? section?.bodyEn : section?.bodyEs) ||
              (isEn ? section?.bodyEs : section?.bodyEn)
            }
          />
        ))}
      </div>

      {leftovers.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {leftovers.map((section) => (
            <article
              key={section.id}
              className="rounded-2xl border border-primary/15 bg-white p-5 shadow-sm dark:border-border dark:bg-card sm:p-6"
            >
              {(isEn ? section.titleEn : section.titleEs) && (
                <h3 className="font-display text-base font-bold text-foreground">
                  {isEn ? section.titleEn : section.titleEs}
                </h3>
              )}
              {(isEn ? section.subtitleEn : section.subtitleEs) && (
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {isEn ? section.subtitleEn : section.subtitleEs}
                </p>
              )}
              {(isEn ? section.bodyEn : section.bodyEs) ? (
                <div className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  <RichTextContent content={isEn ? section.bodyEn : section.bodyEs} />
                </div>
              ) : null}
              {section.imageUrl && (
                <div className="mt-3 overflow-hidden rounded-xl border border-primary/15 dark:border-border">
                  <img
                    src={section.imageUrl}
                    alt={isEn ? (section.titleEn ?? "") : (section.titleEs ?? "")}
                    className="h-auto w-full object-cover"
                  />
                </div>
              )}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function MemberCard({
  member,
  index,
  side,
  isEn,
}: {
  member: AboutSection;
  index: number;
  side: "left" | "right";
  isEn: boolean;
}) {
  const name = `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();
  const role = member.role ?? "";
  const roleI18n = isEn
    ? TEAM_ROLE_TRANSLATIONS[role]?.en
    : TEAM_ROLE_TRANSLATIONS[role]?.es;
  const tag =
    (isEn ? member.subtitleEn : member.subtitleEs) ||
    (isEn ? TEAM_COPY.memberTagEn : TEAM_COPY.memberTagEs);
  const milestone = `${isEn ? TEAM_COPY.milestoneEn : TEAM_COPY.milestoneEs} #${String(index + 1).padStart(2, "0")}`;
  const body = isEn ? member.bodyEn : member.bodyEs;

  return (
    <div
      className={`w-full sm:w-[calc(50%-2rem)] ${
        side === "left" ? "sm:mr-auto" : "sm:ml-auto"
      }`}
    >
      <article className="rounded-2xl border border-primary/15 bg-white p-5 shadow-sm dark:border-border dark:bg-card sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <p className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary dark:bg-primary/10 dark:text-primary">
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="truncate">{tag}</span>
          </p>
          <p className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {milestone}
          </p>
        </div>

        <div className="mt-4 flex items-start gap-3">
          {member.imageUrl ? (
            <img
              src={member.imageUrl}
              alt={name}
              className="h-14 w-14 shrink-0 rounded-xl border border-primary/15 object-cover dark:border-border"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-display text-xl font-bold text-primary dark:bg-primary/10 dark:text-primary">
              {name.charAt(0) || "?"}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold leading-tight text-foreground">
              {name || (isEn ? "Team Member" : "Miembro del equipo")}
            </h3>
            {roleI18n && (
              <p className="mt-1 inline-block rounded-full bg-primary/5 px-2 py-0.5 text-[11px] font-semibold text-primary dark:bg-primary/10 dark:text-primary">
                {roleI18n}
              </p>
            )}
          </div>
        </div>

        {body ? (
          <div className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            <RichTextContent content={body} />
          </div>
        ) : null}
      </article>
    </div>
  );
}

function TeamTimeline({
  members,
  isEn,
}: {
  members: AboutSection[];
  isEn: boolean;
}) {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-4 pt-16 sm:px-6 sm:pt-20">
      <div className="mx-auto max-w-2xl text-center">
        <Eyebrow icon={Users}>
          {isEn ? TEAM_COPY.eyebrowEn : TEAM_COPY.eyebrowEs}
        </Eyebrow>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {isEn ? TEAM_COPY.titleEn : TEAM_COPY.titleEs}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          {isEn ? TEAM_COPY.descEn : TEAM_COPY.descEs}
        </p>
      </div>

      {members.length === 0 ? (
        <p className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-primary/20 bg-card/60 p-6 text-center text-sm text-muted-foreground dark:border-border dark:bg-card">
          {isEn ? TEAM_COPY.emptyEn : TEAM_COPY.emptyEs}
        </p>
      ) : (
        <div className="relative mt-10">
          <div
            className="absolute bottom-0 left-5 top-0 w-0.5 rounded-full bg-primary/20 dark:bg-primary/30 sm:left-1/2 sm:-translate-x-1/2"
            aria-hidden
          />
          <div className="space-y-6 sm:space-y-10">
            {members.map((member, idx) => (
              <div key={member.id} className="relative pl-12 sm:pl-0">
                <span
                  className="absolute left-5 top-8 h-3 w-3 -translate-x-1/2 rounded-full bg-primary ring-4 ring-primary/15 dark:ring-primary/20 sm:left-1/2"
                  aria-hidden
                />
                <MemberCard
                  member={member}
                  index={idx}
                  side={idx % 2 === 0 ? "left" : "right"}
                  isEn={isEn}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function TalentCta({ isEn }: { isEn: boolean }) {
  const email = BRAND.contactEmail;
  return (
    <section className="mx-auto max-w-5xl px-4 pb-2 pt-16 sm:px-6 sm:pt-20">
      <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/15 via-primary/5 to-card p-6 shadow-sm dark:border-border dark:from-primary/10 dark:via-card dark:to-card sm:p-10">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/15 blur-3xl dark:bg-primary/10"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <Eyebrow icon={Sparkles}>
              {isEn ? TALENT_COPY.eyebrowEn : TALENT_COPY.eyebrowEs}
            </Eyebrow>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {isEn ? TALENT_COPY.titleEn : TALENT_COPY.titleEs}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {isEn ? TALENT_COPY.descEn : TALENT_COPY.descEs}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              {isEn ? TALENT_COPY.primaryEn : TALENT_COPY.primaryEs}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-white px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-primary/5 dark:border-border dark:bg-card dark:hover:bg-primary/10"
            >
              <Mail className="h-4 w-4 text-primary" />
              {isEn ? TALENT_COPY.secondaryEn : TALENT_COPY.secondaryEs} {email}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactBanner({ isEn }: { isEn: boolean }) {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20">
      <div className="flex flex-col gap-5 rounded-2xl border border-primary/15 bg-white p-6 shadow-sm dark:border-border dark:bg-card sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[11px] font-semibold text-green-700 dark:bg-green-500/10 dark:text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {isEn ? CONTACT_BANNER.pillEn : CONTACT_BANNER.pillEs}
          </p>
          <h2 className="mt-3 font-display text-xl font-bold text-foreground sm:text-2xl">
            {isEn ? CONTACT_BANNER.titleEn : CONTACT_BANNER.titleEs}
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {isEn ? CONTACT_BANNER.descEn : CONTACT_BANNER.descEs} {BRAND.contactEmail} ·{" "}
            {isEn ? CONTACT_BANNER.cityEn : CONTACT_BANNER.cityEs}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-primary/5 dark:hover:bg-primary/10"
          >
            <MessageSquare className="h-4 w-4 text-primary" />
            {isEn ? CONTACT_BANNER.writeEn : CONTACT_BANNER.writeEs}
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Phone className="h-4 w-4" />
            {isEn ? CONTACT_BANNER.callEn : CONTACT_BANNER.callEs}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

function AboutContent({
  hero,
  generics,
  members,
  stats,
  isEn,
}: {
  hero: AboutSection | null;
  generics: AboutSection[];
  members: AboutSection[];
  stats: AboutSection[];
  isEn: boolean;
}) {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <HeroSection hero={hero} isEn={isEn} />
      <StatsRow stats={stats} isEn={isEn} />
      <PrinciplesSection sections={generics} isEn={isEn} />
      <TeamTimeline members={members} isEn={isEn} />
      <TalentCta isEn={isEn} />
      <ContactBanner isEn={isEn} />
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}

export default async function AboutPage() {
  const { locale } = await getStaticI18n();
  const isEn = locale === "en";

  let sections: AboutSection[];
  try {
    sections = await getPublicPageSectionsAction("about");
  } catch {
    sections = [];
  }

  if (!sections || sections.length === 0) {
    return <AboutContent hero={null} generics={[]} members={[]} stats={[]} isEn={isEn} />;
  }

  const hero = sections.find((s) => s.kind === "hero") ?? null;
  const rest = sections.filter((s) => s.kind !== "hero");
  const members = rest.filter((s) => s.kind === "team");
  const stats = rest.filter((s) => s.kind === "stat");
  const generics = rest.filter((s) => s.kind !== "team" && s.kind !== "stat");

  const [registrationsCount, eventsCount, systemSettings] = await Promise.all([
    db
      .select({ n: count() })
      .from(registrations)
      .where(ne(registrations.status, "cancelled"))
      .then(([row]) => row?.n ?? 0)
      .catch((error) => {
        console.error("[about] Error counting registrations:", error);
        return 0;
      }),
    db
      .select({ n: count() })
      .from(events)
      .then(([row]) => row?.n ?? 0)
      .catch((error) => {
        console.error("[about] Error counting events:", error);
        return 0;
      }),
    getSystemSettings().catch(() => null),
  ]);

  for (const stat of stats) {
    const label = `${stat.titleEs ?? ""} ${stat.titleEn ?? ""}`.toLowerCase();
    let live: string | null = null;
    if (label.includes("escala") || label.includes("proven scale")) {
      live = registrationsCount ? `+${registrationsCount.toLocaleString("en-US")}` : "0";
    } else if (label.includes("confianza") || label.includes("trust")) {
      live = eventsCount ? `+${eventsCount.toLocaleString("en-US")}` : "0";
    } else if (label.includes("satisfacc") || label.includes("satisfaction")) {
      live = systemSettings?.impactSatisfactionRate || "99.8%";
    }
    if (live !== null) {
      stat.subtitleEs = live;
      stat.subtitleEn = live;
    }
  }

  return (
    <AboutContent
      hero={hero}
      generics={generics}
      members={members}
      stats={stats}
      isEn={isEn}
    />
  );
}
