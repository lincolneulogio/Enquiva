import type { Locale } from "@/lib/i18n/core";

export type MailLocale = Locale;

export function mailGreeting(locale: MailLocale, name?: string | null) {
  if (locale === "en") {
    return name ? `Hello ${name},` : "Hello,";
  }
  return name ? `Hola ${name},` : "Hola,";
}

export function broadcastFooterNote(locale: MailLocale, eventTitle: string) {
  if (locale === "en") {
    return `You receive this email because you are registered for "${eventTitle}".`;
  }
  return `Recibes este correo porque estás inscrito en el evento "${eventTitle}".`;
}

export function defaultFooterNote(locale: MailLocale) {
  if (locale === "en") {
    return "This is an automated email. Please do not reply to this message.";
  }
  return "Este es un correo automático. Por favor no respondas a este mensaje.";
}

export function copyrightFooter(locale: MailLocale, orgName: string, year = new Date().getFullYear()) {
  if (locale === "en") {
    return `© ${year} ${orgName}. All rights reserved.`;
  }
  return `© ${year} ${orgName}. Todos los derechos reservados.`;
}

export function customNotificationFooter(locale: MailLocale, orgName: string) {
  if (locale === "en") {
    return `This is an automated message from <strong>${orgName}</strong>.`;
  }
  return `Este es un mensaje automático de la comunidad <strong>${orgName}</strong>.`;
}

export type WelcomeAccountType = "member" | "organizer" | "entity_admin" | "platform_owner";

export function welcomeEmailCopy(
  locale: MailLocale,
  accountType: WelcomeAccountType,
) {
  if (locale === "en") {
    const common = {
      subject: `Welcome to ${accountType === "platform_owner" ? "Eventia" : "the platform"}!`,
      title: "Welcome to Eventia!",
      intro:
        "Your account is verified and ready. We're glad to have you on our events platform.",
    };

    switch (accountType) {
      case "platform_owner":
        return {
          ...common,
          subject: "Welcome — your Eventia platform is ready",
          title: "Your platform is ready",
          intro:
            "You are now the super administrator of Eventia. From the control panel you can manage plans, entities, and users.",
          steps: [
            "Sign in at the super admin area",
            "Initialize roles and subscription plans",
            "Create or support your first client entities",
          ],
          cta: "Go to super admin panel",
        };
      case "entity_admin":
        return {
          ...common,
          intro:
            "Your entity administrator account is active. You can manage your team, events, and organization settings.",
          steps: [
            "Complete your entity profile",
            "Share the invite code with your organizers",
            "Create your first event",
          ],
          cta: "Open admin panel",
        };
      case "organizer":
        return {
          ...common,
          intro:
            "Your organizer account is active. You can create events, manage registrations, and track payments.",
          steps: [
            "Set up your payment methods (Yape, Plin, etc.)",
            "Create and publish your first event",
            "Share the registration link with attendees",
          ],
          cta: "Open organizer panel",
        };
      default:
        return {
          ...common,
          intro:
            "Your attendee account is active. Discover events, register, and manage your tickets from one place.",
          steps: [
            "Browse upcoming events",
            "Register and pay with your preferred method",
            "Access your digital ticket with QR code",
          ],
          cta: "Explore events",
        };
    }
  }

  const common = {
    subject: "¡Bienvenido a Eventia!",
    title: "¡Bienvenido a Eventia!",
    intro:
      "Tu cuenta quedó verificada y lista para usar. Nos alegra tenerte en nuestra plataforma de eventos.",
  };

  switch (accountType) {
    case "platform_owner":
      return {
        ...common,
        subject: "Bienvenido — tu plataforma Eventia está lista",
        title: "Tu plataforma está lista",
        intro:
          "Ya eres el superadministrador de Eventia. Desde el panel podrás gestionar planes, entidades y usuarios.",
        steps: [
          "Inicia sesión en el área de superadministrador",
          "Inicializa roles y planes de suscripción",
          "Crea o acompaña a tus primeras entidades cliente",
        ],
        cta: "Ir al panel superadmin",
      };
    case "entity_admin":
      return {
        ...common,
        intro:
          "Tu cuenta de administrador de entidad está activa. Podrás gestionar tu equipo, eventos y configuración.",
        steps: [
          "Completa el perfil de tu entidad",
          "Comparte el código de invitación con tus organizadores",
          "Crea tu primer evento",
        ],
        cta: "Abrir panel de administración",
      };
    case "organizer":
      return {
        ...common,
        intro:
          "Tu cuenta de organizador está activa. Puedes crear eventos, gestionar inscripciones y seguir los pagos.",
        steps: [
          "Configura tus medios de pago (Yape, Plin, etc.)",
          "Crea y publica tu primer evento",
          "Comparte el enlace de inscripción con los asistentes",
        ],
        cta: "Abrir panel de organizador",
      };
    default:
      return {
        ...common,
        intro:
          "Tu cuenta de asistente está activa. Descubre eventos, inscríbete y gestiona tus entradas en un solo lugar.",
        steps: [
          "Explora los próximos eventos",
          "Inscríbete y paga con tu método preferido",
          "Accede a tu ticket digital con código QR",
        ],
        cta: "Explorar eventos",
      };
  }
}

export function welcomeLoginPath(accountType: WelcomeAccountType): string {
  if (accountType === "platform_owner") return "/superadmin/login";
  if (accountType === "member") return "/events";
  return "/login";
}
