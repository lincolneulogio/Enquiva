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

export type WelcomeAccountType =
  | "member"
  | "organizer"
  | "organizer_pending"
  | "entity_admin"
  | "platform_owner";

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
      case "organizer_pending":
        return {
          ...common,
          subject: "Request received — awaiting entity approval",
          title: "Your request was sent",
          intro:
            "Your account is verified. The entity administrator must approve your request before you can create events for that organization.",
          steps: [
            "Sign in to see the status of your request",
            "The administrator will review your request in the Team section",
            "You will receive an email when you are approved or rejected",
          ],
          cta: "Sign in",
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
    case "organizer_pending":
      return {
        ...common,
        subject: "Solicitud enviada — esperando aprobación de la entidad",
        title: "Tu solicitud fue enviada",
        intro:
          "Tu cuenta quedó verificada. El administrador de la entidad debe aprobar tu solicitud antes de que puedas crear eventos para esa organización.",
        steps: [
          "Inicia sesión para ver el estado de tu solicitud",
          "El administrador la revisará en la sección Equipo",
          "Recibirás un correo cuando seas aprobado o rechazado",
        ],
        cta: "Iniciar sesión",
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

export function organizerRequestAdminEmailCopy(
  locale: MailLocale,
  input: { requesterName: string; requesterEmail: string; organizationName: string },
) {
  if (locale === "en") {
    return {
      subject: `New organizer request — ${input.organizationName}`,
      title: "New organizer request",
      body: `<p><strong>${input.requesterName}</strong> (${input.requesterEmail}) requested to join <strong>${input.organizationName}</strong> as an event organizer.</p><p>Review and approve or reject the request from the Team section in your admin panel.</p>`,
    };
  }
  return {
    subject: `Nueva solicitud de organizador — ${input.organizationName}`,
    title: "Nueva solicitud de organizador",
    body: `<p><strong>${input.requesterName}</strong> (${input.requesterEmail}) solicitó unirse a <strong>${input.organizationName}</strong> como organizador de eventos.</p><p>Revisa y aprueba o rechaza la solicitud desde la sección Equipo en tu panel de administración.</p>`,
  };
}

export function organizerApprovedEmailCopy(
  locale: MailLocale,
  input: { organizationName: string },
) {
  if (locale === "en") {
    return {
      subject: `Approved — you can now organize for ${input.organizationName}`,
      title: "Request approved",
      body: `<p>Your request to join <strong>${input.organizationName}</strong> as an organizer was approved.</p><p>Sign in to create and manage events for this entity.</p>`,
      cta: "Open organizer panel",
    };
  }
  return {
    subject: `Aprobado — ya puedes organizar en ${input.organizationName}`,
    title: "Solicitud aprobada",
    body: `<p>Tu solicitud para unirte a <strong>${input.organizationName}</strong> como organizador fue aprobada.</p><p>Inicia sesión para crear y gestionar eventos de esta entidad.</p>`,
    cta: "Abrir panel de organizador",
  };
}

export function organizerRejectedEmailCopy(
  locale: MailLocale,
  input: { organizationName: string },
) {
  if (locale === "en") {
    return {
      subject: `Update on your request — ${input.organizationName}`,
      title: "Request not approved",
      body: `<p>Your request to join <strong>${input.organizationName}</strong> as an organizer was not approved at this time.</p><p>If you have questions, contact the entity administrator directly.</p>`,
    };
  }
  return {
    subject: `Actualización de tu solicitud — ${input.organizationName}`,
    title: "Solicitud no aprobada",
    body: `<p>Tu solicitud para unirte a <strong>${input.organizationName}</strong> como organizador no fue aprobada en este momento.</p><p>Si tienes dudas, contacta directamente al administrador de la entidad.</p>`,
  };
}
