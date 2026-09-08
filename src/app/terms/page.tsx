import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  CreditCard,
  Landmark,
  Mail,
  MapPin,
  MessageSquare,
  QrCode,
  Scale,
  Cpu,
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
  title: "Términos y condiciones | Enquiva",
  description:
    "Términos y condiciones de uso de la plataforma Enquiva: cuentas, eventos, pagos, tickets y responsabilidades.",
};

type TermsSection = import("@/lib/db/schema").PageSection;

/* ------------------------------------------------------------------ */
/* Contenido curado por defecto (bilingüe, con acentos)                 */
/* Se usa solo si el superadmin no publica cláusulas en /superadmin/terms */
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
  updatedEs: "7 de septiembre de 2026",
  updatedEn: "September 7, 2026",
  updatedLabelEs: "Última actualización:",
  updatedLabelEn: "Last updated:",
  versionEs: "Versión 2 (Revisada)",
  versionEn: "Version 2 (Revised)",
  cityEs: "Huánuco, Perú",
  cityEn: "Huánuco, Peru",
  deskEs: "Mesa de Partes",
  deskEn: "Front Desk",
  contactEs: "Contacto",
  contactEn: "Contact",
};

const SUMMARY_CARDS: Array<{
  icon: LucideIcon;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  footEs: string;
  footEn: string;
}> = [
  {
    icon: Cpu,
    titleEs: "Intermediación Tecnológica",
    titleEn: "Technology Brokerage",
    descEs:
      "Enquiva es la plataforma que conecta organizadores y asistentes: no organiza los eventos, los potencia con software.",
    descEn:
      "Enquiva is the platform connecting organizers and attendees: it does not run events, it powers them with software.",
    footEs: "Artículo 2",
    footEn: "Article 2",
  },
  {
    icon: CreditCard,
    titleEs: "Pagos Seguros en Soles",
    titleEn: "Secure Payments in Soles",
    descEs:
      "Cobros procesados por pasarelas certificadas en moneda nacional (PEN), con comprobantes y trazabilidad total.",
    descEn:
      "Charges processed through certified gateways in national currency (PEN), with receipts and full traceability.",
    footEs: "Artículo 4",
    footEn: "Article 4",
  },
  {
    icon: QrCode,
    titleEs: "Entradas QR y Reembolsos",
    titleEn: "QR Tickets & Refunds",
    descEs:
      "Cada entrada genera un QR único de acceso y las devoluciones siguen la política publicada de cada evento.",
    descEn:
      "Each ticket generates a unique access QR, and refunds follow each event's published policy.",
    footEs: "Artículo 6",
    footEn: "Article 6",
  },
];

const TABS_COPY = {
  eyebrowEs: "Índice del Contrato",
  eyebrowEn: "Contract Index",
  countEs: "Artículos",
  countEn: "Articles",
  emptyEs: "Estamos publicando el articulado. Vuelve pronto.",
  emptyEn: "We are publishing the articles. Check back soon.",
};

const LEGAL_HELP = {
  titleEs: "Asesoría Legal",
  titleEn: "Legal Counsel",
  descEs:
    "¿Tienes dudas sobre cómo estos términos aplican a tu organización? Consulta con nuestro equipo legal en Huánuco.",
  descEn:
    "Questions about how these terms apply to your organization? Consult our legal team in Huánuco.",
  ctaEs: "Consultar",
  ctaEn: "Consult",
};

const CHANNELS_COPY = {
  titleEs: "Canales de Contacto y Mesa de Partes Legal",
  titleEn: "Contact Channels & Legal Front Desk",
  descEs:
    "Para la recepción formal de cartas notariales, solicitudes de tratamiento de datos personales, consultas sobre el ECCP y consultas contractuales de organizaciones, ponemos a disposición los siguientes canales oficiales:",
  descEn:
    "For formal receipt of notarized letters, personal data requests, ECCP inquiries and organizational contract questions, we provide the following official channels:",
};

const CTA_COPY = {
  titleEs: "¿Listo para publicar o vivir tu próximo evento?",
  titleEn: "Ready to publish or experience your next event?",
  descEs: "Crea tu cuenta de organizador y vende tus entradas en la plataforma.",
  descEn: "Create your organizer account and sell your tickets on the platform.",
  primaryEs: "Explorar Cartelera",
  primaryEn: "Explore Events",
  secondaryEs: "Crear Evento Gratis",
  secondaryEn: "Create Free Event",
};

type TermsDefault = {
  num: string;
  titleEs: string;
  titleEn: string;
  paragraphsEs: string[];
  paragraphsEn: string[];
  listEs?: string[];
  listEn?: string[];
  contact?: boolean;
};

const DEFAULT_TERMS: TermsDefault[] = [
  {
    num: "01",
    titleEs: "Aceptación de los términos",
    titleEn: "Acceptance of terms",
    paragraphsEs: [
      "Al acceder o utilizar la plataforma <strong>Enquiva</strong>, confirmas que has leído, entendido y aceptado estos Términos y Condiciones. Si no estás de acuerdo, por favor no uses la plataforma.",
    ],
    paragraphsEn: [
      "By accessing or using the <strong>Enquiva</strong> platform, you confirm that you have read, understood and accepted these Terms and Conditions. If you do not agree, please do not use the platform.",
    ],
  },
  {
    num: "02",
    titleEs: "Cuentas de usuario",
    titleEn: "User accounts",
    paragraphsEs: [
      "Para inscribirte en eventos u organizarlos, debes crear una cuenta con información veraz y actualizada. Eres responsable de mantener la confidencialidad de tus credenciales y de toda la actividad que ocurra en tu cuenta.",
    ],
    paragraphsEn: [
      "To register for events or organize them, you must create an account with truthful and current information. You are responsible for keeping your credentials confidential and for all activity that occurs under your account.",
    ],
    listEs: [
      "Debes tener al menos 18 años para crear una cuenta de organizador.",
      "Debes proporcionar un correo electrónico válido.",
      "Notifica de inmediato cualquier uso no autorizado de tu cuenta.",
    ],
    listEn: [
      "You must be at least 18 years old to create an organizer account.",
      "You must provide a valid email address.",
      "Report any unauthorized use of your account immediately.",
    ],
  },
  {
    num: "03",
    titleEs: "Uso de la plataforma",
    titleEn: "Use of the platform",
    paragraphsEs: [
      "Te comprometes a usar la plataforma únicamente con fines legítimos y de acuerdo con la ley aplicable. Queda prohibido cualquier uso que pueda dañar, sobrecargar o interferir con el funcionamiento de la plataforma o de terceros.",
    ],
    paragraphsEn: [
      "You agree to use the platform only for legitimate purposes and in accordance with applicable law. Any use that may damage, overload or interfere with the platform or third parties is prohibited.",
    ],
  },
  {
    num: "04",
    titleEs: "Eventos e inscripciones",
    titleEn: "Events and registrations",
    paragraphsEs: [
      "Los organizadores publican eventos en la plataforma bajo su propia responsabilidad. <strong>Enquiva</strong> actúa como intermediario tecnológico y no garantiza la realización del evento.",
      "Al inscribirte, el cupo queda reservado según las condiciones del evento. La confirmación de asistencia puede requerir la emisión de un ticket.",
    ],
    paragraphsEn: [
      "Organizers publish events on the platform under their own responsibility. <strong>Enquiva</strong> acts as a technological intermediary and does not guarantee the event will take place.",
      "By registering, your spot is reserved according to the event conditions. Confirmation of attendance may require the issuance of a ticket.",
    ],
  },
  {
    num: "05",
    titleEs: "Pagos y reembolsos",
    titleEn: "Payments and refunds",
    paragraphsEs: [
      "Los pagos de inscripciones se procesan de forma segura en soles (PEN) a través de pasarelas certificadas. La política de reembolso de cada evento es establecida por su organizador y debe ser consultada antes de completar la compra.",
    ],
    paragraphsEn: [
      "Registration payments are processed securely in soles (PEN) through certified gateways. Each event refund policy is set by its organizer and should be reviewed before completing a purchase.",
    ],
  },
  {
    num: "06",
    titleEs: "Tickets y check-in",
    titleEn: "Tickets and check-in",
    paragraphsEs: [
      "El ticket QR emitido es el comprobante de acceso al evento. Es de uso personal e intransferible salvo que el organizador indique lo contrario. El personal de acceso puede validar el ticket mediante escaneo en el momento del ingreso.",
    ],
    paragraphsEn: [
      "The issued QR ticket is proof of access to the event. It is personal and non-transferable unless the organizer states otherwise. Access staff may validate the ticket by scanning at entry.",
    ],
  },
  {
    num: "07",
    titleEs: "Propiedad intelectual",
    titleEn: "Intellectual property",
    paragraphsEs: [
      "Todos los contenidos, marcas, logotipos y diseños de la plataforma son propiedad de <strong>Enquiva</strong> o de sus licenciantes y están protegidos por las leyes de propiedad intelectual. No se permite su reproducción sin autorización.",
    ],
    paragraphsEn: [
      "All content, brands, logos and designs on the platform are the property of <strong>Enquiva</strong> or its licensors and are protected by intellectual property laws. Reproduction without authorization is not permitted.",
    ],
  },
  {
    num: "08",
    titleEs: "Limitación de responsabilidad",
    titleEn: "Limitation of liability",
    paragraphsEs: [
      "En la medida máxima permitida por la ley, <strong>Enquiva</strong> no será responsable por daños indirectos, incidentales o consecuentes derivados del uso de la plataforma o de la asistencia a eventos organizados por terceros.",
    ],
    paragraphsEn: [
      "To the maximum extent permitted by law, <strong>Enquiva</strong> shall not be liable for indirect, incidental or consequential damages arising from the use of the platform or attendance at third-party events.",
    ],
  },
  {
    num: "09",
    titleEs: "Modificaciones",
    titleEn: "Changes",
    paragraphsEs: [
      "Podemos actualizar estos Términos y Condiciones en cualquier momento. La versión vigente estará publicada en esta página, y el uso continuado de la plataforma tras los cambios implica su aceptación.",
    ],
    paragraphsEn: [
      "We may update these Terms and Conditions at any time. The current version will be published on this page, and continued use of the platform after changes implies acceptance.",
    ],
  },
  {
    num: "10",
    titleEs: "Contacto",
    titleEn: "Contact",
    paragraphsEs: [
      "Si tienes preguntas sobre estos términos, usa la página de contacto o escribe a soporte@enquiva.site y te responderemos a la brevedad.",
    ],
    paragraphsEn: [
      "If you have questions about these terms, use the contact page or write to support@enquiva.site and we will reply shortly.",
    ],
    contact: true,
  },
];

function defaultsToTabs(defs: TermsDefault[], isEn: boolean): TermsTabItem[] {
  return defs.map((d, i) => {
    const paragraphs = isEn ? d.paragraphsEn : d.paragraphsEs;
    const list = isEn ? d.listEn : d.listEs;
    const html =
      paragraphs.map((p) => `<p>${p}</p>`).join("") +
      (list && list.length > 0
        ? `<ul>${list.map((item) => `<li>${item}</li>`).join("")}</ul>`
        : "");
    return {
      id: `default-${i}`,
      num: d.num,
      title: isEn ? d.titleEn : d.titleEs,
      html,
      contact: d.contact,
    };
  });
}

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
  const email = BRAND.contactEmail;
  const meta = [
    {
      icon: CalendarClock,
      label: isEn ? HERO_COPY.updatedLabelEn : HERO_COPY.updatedLabelEs,
      value: isEn ? HERO_COPY.updatedEn : HERO_COPY.updatedEs,
    },
    {
      icon: BookOpenCheck,
      label: isEn ? "Version:" : "Versión:",
      value: isEn ? HERO_COPY.versionEn : HERO_COPY.versionEs,
    },
    {
      icon: MapPin,
      label: isEn ? "Jurisdiction:" : "Jurisdicción:",
      value: isEn ? HERO_COPY.cityEn : HERO_COPY.cityEs,
    },
    {
      icon: Landmark,
      label: isEn ? "Currency:" : "Moneda:",
      value: "PEN (S/)",
    },
  ];

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
        <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-2">
          {meta.map(({ icon: Icon, label, value }) => (
            <p
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white px-3 py-1.5 text-[11px] font-medium text-muted-foreground dark:border-border dark:bg-card"
            >
              <Icon className="h-3.5 w-3.5 text-primary" />
              {label} <span className="font-semibold text-foreground">{value}</span>
            </p>
          ))}
        </div>
        <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Mail className="h-4 w-4" />
            {isEn ? HERO_COPY.deskEn : HERO_COPY.deskEs}
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-primary/5"
          >
            <MessageSquare className="h-4 w-4 text-primary" />
            {isEn ? HERO_COPY.contactEn : HERO_COPY.contactEs}
          </Link>
        </div>
      </div>
    </section>
  );
}

function SummaryCards({ isEn }: { isEn: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-2 pt-10 sm:px-6 sm:pt-12">
      <div className="grid gap-4 md:grid-cols-3">
        {SUMMARY_CARDS.map(({ icon: Icon, titleEs, titleEn, descEs, descEn, footEs, footEn }) => (
          <article
            key={titleEn}
            className="rounded-2xl border border-primary/15 bg-white p-5 shadow-sm dark:border-border dark:bg-card sm:p-6"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <h2 className="mt-4 font-display text-base font-bold text-foreground">
              {isEn ? titleEn : titleEs}
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              {isEn ? descEn : descEs}
            </p>
            <p className="mt-4 text-[11px] font-semibold text-primary">
              {isEn ? footEn : footEs} →
            </p>
          </article>
        ))}
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

function LegalChannels({ isEn }: { isEn: boolean }) {
  const email = BRAND.contactEmail;
  return (
    <section className="mx-auto max-w-6xl px-4 pb-2 pt-10 sm:px-6 sm:pt-12">
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-primary/15 bg-white p-6 shadow-sm dark:border-border dark:bg-card lg:col-span-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Scale className="h-4 w-4" />
          </span>
          <h2 className="mt-3 font-display text-base font-bold text-foreground">
            {isEn ? LEGAL_HELP.titleEn : LEGAL_HELP.titleEs}
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            {isEn ? LEGAL_HELP.descEn : LEGAL_HELP.descEs}
          </p>
          <a
            href={`mailto:${email}`}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {isEn ? LEGAL_HELP.ctaEn : LEGAL_HELP.ctaEs}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <div className="rounded-2xl border border-primary/15 bg-white p-6 shadow-sm dark:border-border dark:bg-card lg:col-span-3">
          <h2 className="font-display text-base font-bold text-foreground">
            {isEn ? CHANNELS_COPY.titleEn : CHANNELS_COPY.titleEs}
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            {isEn ? CHANNELS_COPY.descEn : CHANNELS_COPY.descEs}
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-3 rounded-xl bg-primary/5 p-3 dark:bg-primary/10">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mail className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {isEn ? "Virtual front desk" : "Mesa de partes virtual"}
                </p>
                <a
                  href={`mailto:${email}`}
                  className="block truncate font-semibold text-foreground transition-colors hover:text-primary"
                >
                  {email}
                </a>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {isEn ? "Mon–Sat 08:00–22:00 (GMT-5)" : "Lun–Sáb 08:00–22:00 (GMT-5)"}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-xl bg-primary/5 p-3 dark:bg-primary/10">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {isEn ? "Administrative office" : "Sede administrativa"}
                </p>
                <p className="font-semibold text-foreground">Jr. Dámaso Beraún N° 845</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {isEn ? "Huánuco, Peru" : "Huánuco, Perú"}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-xl bg-primary/5 p-3 dark:bg-primary/10">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpenCheck className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {isEn ? "Virtual complaints book" : "Libro de reclamaciones virtual"}
                </p>
                <Link
                  href="/contact"
                  className="font-semibold text-foreground transition-colors hover:text-primary"
                >
                  {isEn ? "File a complaint or claim" : "Registrar queja o reclamo"}
                </Link>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {isEn ? "Consumer protection (INDECOPI)" : "Protección al consumidor (INDECOPI)"}
                </p>
              </div>
            </li>
          </ul>
        </div>
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
  const tabs =
    adminSections.length > 0
      ? adminToTabs(adminSections, isEn)
      : defaultsToTabs(DEFAULT_TERMS, isEn);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <HeroSection isEn={isEn} />
      <SummaryCards isEn={isEn} />
      <ContractTabs tabs={tabs} isEn={isEn} />
      <LegalChannels isEn={isEn} />
      <CtaBanner isEn={isEn} />
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}
