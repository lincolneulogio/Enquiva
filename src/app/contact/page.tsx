import Link from "next/link";
import {
  Building2,
  Clock,
  Mail,
  MapPin,
  MessageSquareHeart,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { ScrollToTopButton } from "@/components/shared/ScrollToTopButton";
import { Footer } from "@/components/landing/Footer";
import { ContactForm } from "@/components/landing/ContactForm";
import { getStaticI18n } from "@/lib/i18n/server";
import { getPublicPageSectionsAction } from "@/actions/admin/pages";
import { getSystemSettings } from "@/lib/settings";
import { BRAND } from "@/lib/brand";

export const revalidate = 120;

export const metadata = {
  title: "Contáctanos | Enquiva",
  description:
    "¿Dudas, soporte o quieres organizar un evento? Contacta al equipo de Enquiva: soporte, ventas empresariales y prensa.",
};

const HERO_COPY = {
  badgeEs: "Centro de atención & experiencia",
  badgeEn: "Care & experience center",
  titleAEs: "Estamos aquí para",
  titleAEn: "We are here to",
  titleAccentEs: "ayudarte",
  titleAccentEn: "help you",
  descEs:
    "¿Preguntas sobre tus entradas, soporte técnico de validación o planeas tu próximo gran festival o conferencia? Escríbenos y nuestro equipo te responderá con calidez.",
  descEn:
    "Questions about your tickets, validation tech support, or planning your next big festival or conference? Write to us and our team will reply warmly.",
};

type AttentionCard = {
  role: string;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  footEs: string;
  footEn: string;
};

function sectionToAttentionCard(section: {
  kind: string | null;
  role: string | null;
  titleEs: string | null;
  titleEn: string | null;
  subtitleEs: string | null;
  subtitleEn: string | null;
  bodyEs: string | null;
  bodyEn: string | null;
}): AttentionCard | null {
  if (section.kind !== "attention") return null;
  return {
    role: section.role ?? "attendee",
    titleEs: section.titleEs ?? "",
    titleEn: section.titleEn ?? "",
    descEs: section.subtitleEs ?? "",
    descEn: section.subtitleEn ?? "",
    footEs: section.bodyEs ?? "",
    footEn: section.bodyEn ?? "",
  };
}

function pickAttentionIcon(role: string): LucideIcon {
  switch (role) {
    case "business":
      return Building2;
    case "hours":
      return Clock;
    default:
      return Ticket;
  }
}

const FORM_COPY = {
  titleEs: "Envíanos un mensaje",
  titleEn: "Send us a message",
  descEs: "Completa el formulario y un especialista responderá directamente a tu bandeja.",
  descEn: "Fill in the form and a specialist will reply straight to your inbox.",
  badgeEs: "Respuesta en < 24h",
  badgeEn: "Reply in < 24h",
};

const DIRECT_COPY = {
  titleEs: "Datos de contacto directo",
  titleEn: "Direct contact details",
  descEs: "Comunícate con nuestras bandejas centralizadas según tu perfil.",
  descEn: "Reach our centralized inboxes according to your profile.",
};

type DirectChannel = {
  role: string;
  titleEs: string;
  titleEn: string;
  valueEs: string;
  valueEn: string;
  detailEs: string;
  detailEn: string;
};

function sectionToDirectChannel(
  section: {
    kind: string | null;
    role: string | null;
    titleEs: string | null;
    titleEn: string | null;
    subtitleEs: string | null;
    subtitleEn: string | null;
    bodyEs: string | null;
    bodyEn: string | null;
  },
  settings: { publicContactEmail?: string | null; supportEmail?: string | null } | null,
): DirectChannel | null {
  if (section.kind !== "contact") return null;
  const role = section.role ?? "email";
  // Fuente única: si el canal no trae valor propio, hereda de Identidad global.
  // Solo los roles de correo heredan; la sede (address) siempre es manual.
  const inherited =
    role === "support"
      ? settings?.supportEmail?.trim() || ""
      : role === "email" || role === "corporate"
        ? settings?.publicContactEmail?.trim() || ""
        : "";
  return {
    role,
    titleEs: section.titleEs ?? "",
    titleEn: section.titleEn ?? "",
    valueEs: section.subtitleEs?.trim() || inherited,
    valueEn: section.subtitleEn?.trim() || inherited,
    detailEs: section.bodyEs ?? "",
    detailEn: section.bodyEn ?? "",
  };
}

function pickDirectChannelIcon(role: string): LucideIcon {
  switch (role) {
    case "support":
      return MessageSquareHeart;
    case "corporate":
      return Building2;
    case "address":
      return MapPin;
    default:
      return Mail;
  }
}

const BANNER_COPY = {
  titleEs: "¿Tienes dudas o ideas para tu próximo evento?",
  titleEn: "Questions or ideas for your next event?",
  descEs: "Escríbenos y te ayudamos a organizar tu evento",
  descEn: "Write to us and we will help you organize your event",
  secondaryEs: "Unirme a Enquiva",
  secondaryEn: "Join Enquiva",
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
      {children}
    </p>
  );
}

export default async function ContactPage() {
  const { locale } = await getStaticI18n();
  const isEn = locale === "en";

  let sections: Array<{
    kind: string | null;
    role: string | null;
    titleEs: string | null;
    titleEn: string | null;
    subtitleEs: string | null;
    subtitleEn: string | null;
    bodyEs: string | null;
    bodyEn: string | null;
  }>;
  try {
    sections = await getPublicPageSectionsAction("contact");
  } catch {
    sections = [];
  }
  const systemSettings = await getSystemSettings().catch(() => null);
  const contactEmail = systemSettings?.publicContactEmail?.trim() || BRAND.contactEmail;

  const directChannels = (sections ?? [])
    .map((s) => sectionToDirectChannel(s, systemSettings))
    .filter((c): c is DirectChannel => c !== null);

  const attentionCards = (sections ?? [])
    .map(sectionToAttentionCard)
    .filter((c): c is AttentionCard => c !== null);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
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

      {/* Canales de atención (solo DB) */}
      {attentionCards.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-2 pt-10 sm:px-6 sm:pt-12">
          <div className="grid gap-4 md:grid-cols-3">
          {attentionCards.map((card) => {
            const Icon = pickAttentionIcon(card.role);
            const online = card.role === "hours";
            const title = isEn ? card.titleEn : card.titleEs;
            const desc = isEn ? card.descEn : card.descEs;
            const foot = isEn ? card.footEn : card.footEs;
            return (
              <article
                key={card.role}
                className="rounded-2xl border border-primary/15 bg-white p-5 shadow-sm dark:border-border dark:bg-card sm:p-6"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <h2 className="mt-4 font-display text-base font-bold text-foreground">
                  {title}
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {desc}
                </p>
                <p className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                  {online ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden />
                  ) : null}
                  {foot}
                </p>
              </article>
            );
          })}
          </div>
        </section>
      ) : null}

      {/* Formulario + contacto directo */}
      <section className="mx-auto max-w-6xl px-4 pb-2 pt-10 sm:px-6 sm:pt-12">
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Formulario */}
          <div className={directChannels.length > 0 ? "lg:col-span-3" : "lg:col-span-5"}>
            <div className="rounded-2xl border border-primary/15 bg-white p-6 shadow-sm dark:border-border dark:bg-card sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    {isEn ? FORM_COPY.titleEn : FORM_COPY.titleEs}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isEn ? FORM_COPY.descEn : FORM_COPY.descEs}
                  </p>
                </div>
                <p className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                  {isEn ? FORM_COPY.badgeEn : FORM_COPY.badgeEs}
                </p>
              </div>

              <ContactForm isEn={isEn} />
            </div>
          </div>

          {/* Columna derecha (solo DB) */}
          {directChannels.length > 0 ? (
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl border border-primary/15 bg-white p-6 shadow-sm dark:border-border dark:bg-card">
              <h3 className="font-display text-base font-bold text-foreground">
                {isEn ? DIRECT_COPY.titleEn : DIRECT_COPY.titleEs}
              </h3>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {isEn ? DIRECT_COPY.descEn : DIRECT_COPY.descEs}
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                {directChannels.map((ch) => {
                  const Icon = pickDirectChannelIcon(ch.role);
                  const title = isEn ? ch.titleEn : ch.titleEs;
                  const value = isEn ? ch.valueEn : ch.valueEs;
                  const detail = isEn ? ch.detailEn : ch.detailEs;
                  const isAddress = ch.role === "address";
                  return (
                    <li
                      key={`${ch.role}-${title}`}
                      className="flex items-start gap-3 rounded-xl bg-primary/5 p-3 dark:bg-primary/10"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {title}
                          {ch.role === "support" ? (
                            <span className="rounded-full bg-primary/15 px-1.5 py-px text-[9px] font-bold normal-case tracking-normal text-primary">
                              {isEn ? "Fast" : "Rápido"}
                            </span>
                          ) : null}
                        </p>
                        {isAddress ? (
                          <>
                            <p className="font-semibold text-foreground">{value}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p>
                          </>
                        ) : (
                          <>
                            <a
                              href={`mailto:${value}`}
                              className="block truncate font-semibold text-foreground transition-colors hover:text-primary"
                            >
                              {value}
                            </a>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
          ) : null}
        </div>
      </section>

      {/* Banner final */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-12">
        <div className="flex flex-col gap-5 rounded-2xl bg-foreground p-6 text-background shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between dark:border dark:border-border">
          <div>
            <h2 className="font-display text-xl font-bold sm:text-2xl">
              {isEn ? BANNER_COPY.titleEn : BANNER_COPY.titleEs}
            </h2>
            <p className="mt-1 text-[13px] opacity-80">
              {isEn ? BANNER_COPY.descEn : BANNER_COPY.descEs}: {contactEmail} ·{" "}
              {isEn ? "Huánuco, Peru" : "Huánuco, Perú"}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              {isEn ? BANNER_COPY.secondaryEn : BANNER_COPY.secondaryEs}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <ScrollToTopButton />
    </div>
  );
}
