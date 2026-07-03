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
