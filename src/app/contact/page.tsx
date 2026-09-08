import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ChevronRight,
  Clock,
  Mail,
  MapPin,
  MessageSquareHeart,
  Ticket,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { ScrollToTopButton } from "@/components/shared/ScrollToTopButton";
import { Footer } from "@/components/landing/Footer";
import { ContactForm } from "@/components/landing/ContactForm";
import { getStaticI18n } from "@/lib/i18n/server";
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

const CHANNELS: Array<{
  icon: LucideIcon;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  footEs: string;
  footEn: string;
  online?: boolean;
}> = [
  {
    icon: Ticket,
    titleEs: "Soporte a Asistentes",
    titleEn: "Attendee Support",
    descEs:
      "Descarga y reenvío de tickets QR, cambios de titular, verificación de pagos con Yape, Plin o tarjetas.",
    descEn:
      "QR ticket download and resend, holder changes, payment verification with Yape, Plin or cards.",
    footEs: "Respuesta promedio < 45 min",
    footEn: "Average reply < 45 min",
  },
  {
    icon: Building2,
    titleEs: "Empresarial & Eventos",
    titleEn: "Business & Events",
    descEs:
      "Asesoría personalizada para productores, configuración de múltiples tipos de boletos y pasarelas bancarias.",
    descEn:
      "Personalized advice for producers, setup of multiple ticket types and bank gateways.",
    footEs: "Atención ejecutiva dedicada",
    footEn: "Dedicated executive support",
  },
  {
    icon: Clock,
    titleEs: "Horario Continuo",
    titleEn: "Always-on Hours",
    descEs:
      "Mesa técnica operativa de lunes a domingo de 08:00 a 22:00 hrs (GMT-5). Guardias activas en días de concierto.",
    descEn:
      "Tech desk open Monday to Sunday, 08:00–22:00 (GMT-5). Active on-call during concert days.",
    footEs: "En línea ahora",
    footEn: "Online now",
    online: true,
  },
];

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

const ORGANIZE_COPY = {
  titleEs: "¿Prefieres organizar tú mismo?",
  titleEn: "Prefer to organize yourself?",
  descEs:
    "Crea tu evento en minutos desde tu panel de organizador, con control total de aforo, escaneo de tickets QR y venta directa sin intermediarios.",
  descEn:
    "Create your event in minutes from your organizer panel, with full capacity control, QR ticket scanning and direct sales with no middlemen.",
  primaryEs: "Ver planes SaaS",
  primaryEn: "See SaaS plans",
  secondaryEs: "Demo en vivo",
  secondaryEn: "Live demo",
};

const FAQ_COPY = {
  titleEs: "Preguntas frecuentes rápidas",
  titleEn: "Quick FAQs",
  itemsEs: [
    "¿Cómo transfiero mi entrada a otra persona?",
    "¿Qué comisiones aplican a las ventas de entradas?",
    "¿Cómo funciona el check-in con la app de escaneo?",
  ],
  itemsEn: [
    "How do I transfer my ticket to someone else?",
    "Which fees apply to ticket sales?",
    "How does check-in work with the scanning app?",
  ],
};

const BANNER_COPY = {
  titleEs: "¿Tienes dudas o ideas para tu próximo evento?",
  titleEn: "Questions or ideas for your next event?",
  descEs: "Escríbenos y te ayudamos a organizar tu evento",
  descEn: "Write to us and we will help you organize your event",
  primaryEs: "Escribir mensaje",
  primaryEn: "Write a message",
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
  const contactEmail = BRAND.contactEmail;
  const supportEmail = BRAND.supportEmail;
  const faqItems = isEn ? FAQ_COPY.itemsEn : FAQ_COPY.itemsEs;

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
            <span className="relative inline-block text-primary">
              {isEn ? HERO_COPY.titleAccentEn : HERO_COPY.titleAccentEs}
              <span
                className="absolute inset-x-0 -bottom-1 h-[3px] rounded-full bg-foreground/80"
                aria-hidden
              />
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {isEn ? HERO_COPY.descEn : HERO_COPY.descEs}
          </p>
        </div>
      </section>

      {/* Canales de atención */}
      <section className="mx-auto max-w-6xl px-4 pb-2 pt-10 sm:px-6 sm:pt-12">
        <div className="grid gap-4 md:grid-cols-3">
          {CHANNELS.map(({ icon: Icon, titleEs, titleEn, descEs, descEn, footEs, footEn, online }) => (
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
              <p className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                {online ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden />
                ) : null}
                {isEn ? footEn : footEs}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Formulario + contacto directo */}
      <section className="mx-auto max-w-6xl px-4 pb-2 pt-10 sm:px-6 sm:pt-12">
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Formulario */}
          <div className="lg:col-span-3">
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

          {/* Columna derecha */}
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl border border-primary/15 bg-white p-6 shadow-sm dark:border-border dark:bg-card">
              <h3 className="font-display text-base font-bold text-foreground">
                {isEn ? DIRECT_COPY.titleEn : DIRECT_COPY.titleEs}
              </h3>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {isEn ? DIRECT_COPY.descEn : DIRECT_COPY.descEs}
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-3 rounded-xl bg-primary/5 p-3 dark:bg-primary/10">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {isEn ? "General inbox" : "Atención general"}
                    </p>
                    <a
                      href={`mailto:${contactEmail}`}
                      className="block truncate font-semibold text-foreground transition-colors hover:text-primary"
                    >
                      {contactEmail}
                    </a>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {isEn ? "General and institutional info" : "Información general e institucional"}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 rounded-xl bg-primary/5 p-3 dark:bg-primary/10">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MessageSquareHeart className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {isEn ? "Support & validation" : "Soporte y validación"}
                      <span className="rounded-full bg-primary/15 px-1.5 py-px text-[9px] font-bold normal-case tracking-normal text-primary">
                        {isEn ? "Fast" : "Rápido"}
                      </span>
                    </p>
                    <a
                      href={`mailto:${supportEmail}`}
                      className="block truncate font-semibold text-foreground transition-colors hover:text-primary"
                    >
                      {supportEmail}
                    </a>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {isEn ? "Tickets, refunds and QR validations" : "Tickets, reembolsos y validaciones QR"}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 rounded-xl bg-primary/5 p-3 dark:bg-primary/10">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {isEn ? "Corporate events" : "Eventos empresariales"}
                    </p>
                    <a
                      href={`mailto:${contactEmail}`}
                      className="block truncate font-semibold text-foreground transition-colors hover:text-primary"
                    >
                      {contactEmail}
                    </a>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {isEn ? "Large productions and SaaS contracts" : "Producciones masivas y contratos SaaS"}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 rounded-xl bg-primary/5 p-3 dark:bg-primary/10">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {isEn ? "Huánuco headquarters" : "Sede central Huánuco"}
                    </p>
                    <p className="font-semibold text-foreground">Jr. Dámaso Beraún N° 845</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {isEn ? "Huánuco, Peru · Front desk" : "Huánuco, Perú · Mesa de Partes"}
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-primary/5 to-card p-6 dark:border-border dark:from-primary/10 dark:via-card dark:to-card">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Zap className="h-4 w-4" />
              </span>
              <h3 className="mt-3 font-display text-base font-bold text-foreground">
                {isEn ? ORGANIZE_COPY.titleEn : ORGANIZE_COPY.titleEs}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {isEn ? ORGANIZE_COPY.descEn : ORGANIZE_COPY.descEs}
              </p>
              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  {isEn ? ORGANIZE_COPY.primaryEn : ORGANIZE_COPY.primaryEs}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={`mailto:${contactEmail}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-primary/5"
                >
                  {isEn ? ORGANIZE_COPY.secondaryEn : ORGANIZE_COPY.secondaryEs}
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-primary/15 bg-white p-6 dark:border-border dark:bg-card">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {isEn ? FAQ_COPY.titleEn : FAQ_COPY.titleEs}
              </h3>
              <ul className="mt-2 divide-y divide-border/70">
                {faqItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-center justify-between gap-3 py-2.5 text-[13px] font-medium text-foreground"
                  >
                    <span>{item}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
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
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-background px-5 py-3 text-sm font-bold text-foreground transition-colors hover:opacity-90"
            >
              {isEn ? BANNER_COPY.primaryEn : BANNER_COPY.primaryEs}
            </a>
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
