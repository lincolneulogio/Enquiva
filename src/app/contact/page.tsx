import { Mail, MessageSquareHeart, Building2, Clock, ArrowRight, Send } from "lucide-react";
import { PublicHeader } from "@/components/shared/PublicHeader";
import { PublicPageHero } from "@/components/shared/PublicPageHero";
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

export default async function ContactPage() {
  const { locale } = await getStaticI18n();
  const isEn = locale === "en";
  const contactEmail = BRAND.contactEmail;
  const supportEmail = BRAND.supportEmail;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <PublicPageHero
        align="center"
        badge={isEn ? "Contact" : "Contacto"}
        badgeIcon={Mail}
        title={isEn ? "We are here to" : "Estamos aquí para"}
        titleHighlight={isEn ? "help you" : "ayudarte"}
        description={
          isEn
            ? "Questions, support or planning your next big event? Reach out and our team will get back to you shortly."
            : "¿Preguntas, soporte o planeas tu próximo gran evento? Escríbenos y nuestro equipo te responderá a la brevedad."
        }
        highlights={[
          {
            icon: MessageSquareHeart,
            title: isEn ? "Support" : "Soporte",
            description: isEn
              ? "Help with tickets, payments, accounts or the platform."
              : "Ayuda con tickets, pagos, cuentas o la plataforma.",
          },
          {
            icon: Building2,
            title: isEn ? "Business" : "Empresarial",
            description: isEn
              ? "Organize events for your company or organization."
              : "Organiza eventos para tu empresa u organización.",
          },
          {
            icon: Clock,
            title: isEn ? "Response time" : "Tiempo de respuesta",
            description: isEn
              ? "Most messages are answered within 24 hours on business days."
              : "La mayoría de mensajes se responden en menos de 24 h hábiles.",
          },
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Formulario */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
              <h2 className="font-display text-xl font-semibold text-foreground">
                {isEn ? "Send us a message" : "Envíanos un mensaje"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isEn
                  ? "Fill in the form and we will respond to the email you provide."
                  : "Completa el formulario y te responderemos al correo que indiques."}
              </p>

              <ContactForm isEn={isEn} />
            </div>
          </div>

          {/* Información de contacto */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
              <h3 className="font-display text-base font-semibold text-foreground mb-4">
                {isEn ? "Contact details" : "Datos de contacto"}
              </h3>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {isEn ? "General" : "General"}
                    </p>
                    <a href={`mailto:${contactEmail}`} className="font-medium text-foreground hover:text-primary transition-colors break-all">
                      {contactEmail}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MessageSquareHeart className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {isEn ? "Support" : "Soporte"}
                    </p>
                    <a href={`mailto:${supportEmail}`} className="font-medium text-foreground hover:text-primary transition-colors break-all">
                      {supportEmail}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {isEn ? "Business events" : "Eventos empresariales"}
                    </p>
                    <a href={`mailto:${contactEmail}`} className="font-medium text-foreground hover:text-primary transition-colors break-all">
                      {contactEmail}
                    </a>
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-6">
              <h3 className="font-display text-base font-semibold text-foreground mb-2">
                {isEn ? "Prefer to organize yourself?" : "¿Prefieres organizar tú mismo?"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isEn
                  ? "Create your event in minutes from your organizer panel, no need to contact us."
                  : "Crea tu evento en minutos desde tu panel de organizador, sin necesidad de contactarnos."}
              </p>
              <a
                href="/pricing"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md"
              >
                {isEn ? "See plans" : "Ver planes"}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <ScrollToTopButton />
    </div>
  );
}
