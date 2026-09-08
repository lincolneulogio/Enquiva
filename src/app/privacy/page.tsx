import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CalendarClock,
  Database,
  EyeOff,
  FileCheck,
  Mail,
  MapPin,
  MessageSquare,
  Scale,
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
/* Contenido curado por defecto (bilingüe, con acentos)                 */
/* Se usa solo si el superadmin no publica cláusulas en /superadmin/privacy */
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
  updatedEs: "12 de octubre de 2026",
  updatedEn: "October 12, 2026",
  updatedLabelEs: "Última actualización:",
  updatedLabelEn: "Last updated:",
  versionEs: "Versión 4.0",
  versionEn: "Version 4.0",
  lawEs: "Ley N° 29733",
  lawEn: "Law No. 29733",
  cityEs: "Huánuco, Perú",
  cityEn: "Huánuco, Peru",
  deskEs: "Consultar DPO",
  deskEn: "Consult DPO",
  contactEs: "Contacto",
  contactEn: "Contact",
};

const PRINCIPLES: Array<{
  icon: LucideIcon;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  footEs: string;
  footEn: string;
}> = [
  {
    icon: Database,
    titleEs: "Mínimos Datos Necesarios",
    titleEn: "Minimum Necessary Data",
    descEs:
      "Solo solicitamos la información indispensable para operar tu cuenta y validar tu acceso a los eventos.",
    descEn:
      "We only request the information essential to operate your account and validate your event access.",
    footEs: "Principio de proporcionalidad",
    footEn: "Proportionality principle",
  },
  {
    icon: EyeOff,
    titleEs: "Cero Venta de Información",
    titleEn: "Zero Data Selling",
    descEs:
      "Nunca comercializamos, cedemos ni alquilamos tus datos personales a terceros con fines publicitarios.",
    descEn:
      "We never sell, share or rent your personal data to third parties for advertising purposes.",
    footEs: "Prohibido por defecto",
    footEn: "Forbidden by default",
  },
  {
    icon: BadgeCheck,
    titleEs: "Derechos ARCO Garantizados",
    titleEn: "Guaranteed ARCO Rights",
    descEs:
      "Tienes derecho a Acceder, Rectificar, Cancelar u Oponerte al tratamiento de tus datos personales.",
    descEn:
      "You have the right to Access, Rectify, Erase or Object to the processing of your personal data.",
    footEs: "Ley N° 29733 (Perú)",
    footEn: "Law No. 29733 (Peru)",
  },
];

const TABS_COPY = {
  eyebrowEs: "Índice de Privacidad",
  eyebrowEn: "Privacy Index",
  countEs: "Artículos",
  countEn: "Articles",
  emptyEs: "Estamos publicando el articulado. Vuelve pronto.",
  emptyEn: "We are publishing the articles. Check back soon.",
};

const DPO_COPY = {
  titleEs: "Oficial de Datos (DPO)",
  titleEn: "Data Officer (DPO)",
  descEs:
    "Ejerce tus derechos ARCO o reporta un incidente de seguridad escribiendo a nuestro Oficial de Protección de Datos.",
  descEn:
    "Exercise your ARCO rights or report a security incident by writing to our Data Protection Officer.",
  ctaEs: "Escribir al DPO",
  ctaEn: "Write to the DPO",
};

const ARCO_ITEMS: Array<{
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
}> = [
  {
    titleEs: "Acceso",
    titleEn: "Access",
    descEs: "Consulta qué datos personales tenemos sobre ti.",
    descEn: "See what personal data we hold about you.",
  },
  {
    titleEs: "Rectificación",
    titleEn: "Rectification",
    descEs: "Corrige datos inexactos o desactualizados.",
    descEn: "Correct inaccurate or outdated data.",
  },
  {
    titleEs: "Cancelación",
    titleEn: "Erasure",
    descEs: "Solicita la eliminación de tu cuenta y tus datos.",
    descEn: "Request deletion of your account and data.",
  },
  {
    titleEs: "Oposición",
    titleEn: "Objection",
    descEs: "Oponte a tratamientos específicos de tu información.",
    descEn: "Object to specific processing of your information.",
  },
];

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

type PrivacyDefault = {
  num: string;
  titleEs: string;
  titleEn: string;
  paragraphsEs: string[];
  paragraphsEn: string[];
  listEs?: string[];
  listEn?: string[];
  contact?: boolean;
};

const DEFAULT_PRIVACY: PrivacyDefault[] = [
  {
    num: "01",
    titleEs: "Información que recopilamos",
    titleEn: "Information we collect",
    paragraphsEs: [
      "Recopilamos la información que nos proporcionas directamente, como tu nombre, correo electrónico y datos de contacto al crear una cuenta o inscribirte.",
    ],
    paragraphsEn: [
      "We collect information you provide directly, such as your name, email address and contact details when creating an account or registering.",
    ],
    listEs: [
      "Datos de cuenta: nombre, correo electrónico y preferencias.",
      "Datos de inscripción y pago: información necesaria para procesar tu compra de entradas.",
      "Datos técnicos: dirección IP, tipo de navegador y registros de actividad para mejorar el servicio y la seguridad.",
    ],
    listEn: [
      "Account data: name, email address and preferences.",
      "Registration and payment data: information needed to process your ticket purchase.",
      "Technical data: IP address, browser type and activity logs to improve service and security.",
    ],
  },
  {
    num: "02",
    titleEs: "Uso de la información",
    titleEn: "How we use information",
    paragraphsEs: [
      "Utilizamos tu información para prestar los servicios de la plataforma, procesar inscripciones y pagos, enviarte comunicaciones relevantes y mejorar tu experiencia.",
    ],
    paragraphsEn: [
      "We use your information to provide the platform services, process registrations and payments, send relevant communications and improve your experience.",
    ],
    listEs: [
      "Gestionar tu cuenta, eventos e inscripciones.",
      "Procesar pagos y emitir tickets.",
      "Enviarte notificaciones sobre eventos a los que te has inscrito.",
      "Enviarte el boletín de novedades si te suscribes (puedes darte de baja en cualquier momento).",
      "Garantizar la seguridad y prevenir fraudes o usos abusivos.",
    ],
    listEn: [
      "Manage your account, events and registrations.",
      "Process payments and issue tickets.",
      "Send you notifications about events you have registered for.",
      "Send you the newsletter if you subscribe (you may unsubscribe at any time).",
      "Ensure security and prevent fraud or abusive use.",
    ],
  },
  {
    num: "03",
    titleEs: "Compartir información",
    titleEn: "Sharing information",
    paragraphsEs: [
      "No vendemos tu información personal a terceros. Podemos compartirla únicamente en los siguientes casos:",
    ],
    paragraphsEn: [
      "We do not sell your personal information to third parties. We may share it only in the following cases:",
    ],
    listEs: [
      "Con los organizadores de los eventos a los que te inscribes, para la gestión del evento.",
      "Con proveedores de pago y servicios técnicos necesarios para el funcionamiento de la plataforma.",
      "Cuando la ley lo exija o para proteger derechos legales.",
    ],
    listEn: [
      "With the organizers of the events you register for, to manage the event.",
      "With payment providers and technical services necessary for the platform to function.",
      "When required by law or to protect legal rights.",
    ],
  },
  {
    num: "04",
    titleEs: "Seguridad de los datos",
    titleEn: "Data security",
    paragraphsEs: [
      "Implementamos medidas técnicas y organizativas razonables para proteger tu información contra acceso no autorizado, pérdida o alteración. Los pagos se procesan a través de pasarelas seguras.",
    ],
    paragraphsEn: [
      "We implement reasonable technical and organizational measures to protect your information from unauthorized access, loss or alteration. Payments are processed through secure gateways.",
    ],
  },
  {
    num: "05",
    titleEs: "Cookies y tecnologías similares",
    titleEn: "Cookies and similar technologies",
    paragraphsEs: [
      "Usamos cookies para recordar tu sesión, preferencias de idioma y tema, y para entender cómo se usa la plataforma. Puedes configurar tu navegador para rechazarlas, aunque algunas funciones podrían verse afectadas.",
    ],
    paragraphsEn: [
      "We use cookies to remember your session, language and theme preferences, and to understand how the platform is used. You can configure your browser to reject them, although some features may be affected.",
    ],
  },
  {
    num: "06",
    titleEs: "Tus derechos",
    titleEn: "Your rights",
    paragraphsEs: [
      "Tienes derecho a acceder, corregir o eliminar tu información personal, y a oponerte al tratamiento de la misma en los casos previstos por la ley.",
    ],
    paragraphsEn: [
      "You have the right to access, correct or delete your personal information, and to object to its processing where provided by law.",
    ],
    listEs: [
      "Acceder a los datos que tenemos sobre ti.",
      "Solicitar la corrección de datos inexactos.",
      "Solicitar la eliminación de tu cuenta y datos.",
      "Darte de baja del boletín en cualquier momento.",
    ],
    listEn: [
      "Access the data we hold about you.",
      "Request correction of inaccurate data.",
      "Request deletion of your account and data.",
      "Unsubscribe from the newsletter at any time.",
    ],
  },
  {
    num: "07",
    titleEs: "Retención de datos",
    titleEn: "Data retention",
    paragraphsEs: [
      "Conservamos tu información únicamente durante el tiempo necesario para las finalidades descritas en esta política y para cumplir con obligaciones legales.",
    ],
    paragraphsEn: [
      "We retain your information only for as long as necessary for the purposes described in this policy and to comply with legal obligations.",
    ],
  },
  {
    num: "08",
    titleEs: "Cambios en esta política",
    titleEn: "Changes to this policy",
    paragraphsEs: [
      "Podemos actualizar esta Política de Privacidad. Publicaremos la versión vigente en esta página y te notificaremos los cambios relevantes.",
    ],
    paragraphsEn: [
      "We may update this Privacy Policy. We will publish the current version on this page and notify you of relevant changes.",
    ],
  },
  {
    num: "09",
    titleEs: "Contacto",
    titleEn: "Contact",
    paragraphsEs: [
      "Para consultas sobre privacidad, usa la página de contacto o escribe a soporte@enquiva.site y te responderemos a la brevedad.",
    ],
    paragraphsEn: [
      "For privacy questions, use the contact page or write to support@enquiva.site and we will reply shortly.",
    ],
    contact: true,
  },
];

function defaultsToTabs(defs: PrivacyDefault[], isEn: boolean): TermsTabItem[] {
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
      icon: Scale,
      label: isEn ? "Framework:" : "Marco:",
      value: isEn ? HERO_COPY.lawEn : HERO_COPY.lawEs,
    },
    {
      icon: MapPin,
      label: isEn ? "Jurisdiction:" : "Jurisdicción:",
      value: isEn ? HERO_COPY.cityEn : HERO_COPY.cityEs,
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

function PrinciplesSection({ isEn }: { isEn: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-2 pt-10 sm:px-6 sm:pt-12">
      <div className="grid gap-4 md:grid-cols-3">
        {PRINCIPLES.map(({ icon: Icon, titleEs, titleEn, descEs, descEn, footEs, footEn }) => (
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
              {isEn ? footEn : footEs}
            </p>
          </article>
        ))}
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

function DpoArco({ isEn }: { isEn: boolean }) {
  const email = BRAND.contactEmail;
  return (
    <section className="mx-auto max-w-6xl px-4 pb-2 pt-10 sm:px-6 sm:pt-12">
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-primary/15 bg-white p-6 shadow-sm dark:border-border dark:bg-card lg:col-span-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileCheck className="h-4 w-4" />
          </span>
          <h2 className="mt-3 font-display text-base font-bold text-foreground">
            {isEn ? DPO_COPY.titleEn : DPO_COPY.titleEs}
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            {isEn ? DPO_COPY.descEn : DPO_COPY.descEs}
          </p>
          <a
            href={`mailto:${email}`}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Mail className="h-4 w-4" />
            {isEn ? DPO_COPY.ctaEn : DPO_COPY.ctaEs}
          </a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
          {ARCO_ITEMS.map(({ titleEs, titleEn, descEs, descEn }) => (
            <article
              key={titleEn}
              className="rounded-2xl border border-primary/15 bg-white p-5 shadow-sm dark:border-border dark:bg-card"
            >
              <h3 className="font-display text-sm font-bold text-foreground">
                {isEn ? titleEn : titleEs}
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                {isEn ? descEn : descEs}
              </p>
            </article>
          ))}
        </div>
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
  const tabs =
    adminSections.length > 0
      ? adminToTabs(adminSections, isEn)
      : defaultsToTabs(DEFAULT_PRIVACY, isEn);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <HeroSection isEn={isEn} />
      <PrinciplesSection isEn={isEn} />
      <PrivacyTabs tabs={tabs} isEn={isEn} />
      <DpoArco isEn={isEn} />
      <CtaBanner isEn={isEn} />
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}
