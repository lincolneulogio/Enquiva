import {
  defaultFooterNote,
  organizerApprovedEmailCopy,
  organizerRejectedEmailCopy,
  organizerRequestAdminEmailCopy,
  type MailLocale,
} from "../locale-strings";
import { wrapInTemplate } from "./base-wrapper";

export function organizerStatusEmailTemplate(opts: {
  greeting: string;
  subject: string;
  title: string;
  bodyHtml: string;
  cta?: string;
  ctaUrl?: string;
  orgName?: string;
  locale?: MailLocale;
}) {
  const locale = opts.locale ?? "es";
  const ctaBlock =
    opts.cta && opts.ctaUrl
      ? `<div style="text-align: center; margin: 32px 0 8px 0;">
      <a href="${opts.ctaUrl}" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 16px 36px; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 16px; display: inline-block; box-shadow: 0 10px 20px -5px rgba(234, 88, 12, 0.3); font-family: 'Outfit', sans-serif;">
        ${opts.cta}
      </a>
    </div>`
      : "";

  const bodyHtml = `${opts.bodyHtml}${ctaBlock}`;

  return {
    subject: opts.subject,
    text: `${opts.greeting}\n\n${opts.bodyHtml.replace(/<[^>]+>/g, "")}`,
    html: wrapInTemplate(opts.title, opts.greeting, bodyHtml, defaultFooterNote(locale), opts.orgName, locale),
  };
}

export function getOrganizerRequestAdminEmailTemplate(opts: {
  greeting: string;
  requesterName: string;
  requesterEmail: string;
  organizationName: string;
  teamUrl: string;
  orgName?: string;
  locale?: MailLocale;
}) {
  const locale = opts.locale ?? "es";
  const copy = organizerRequestAdminEmailCopy(locale, {
    requesterName: opts.requesterName,
    requesterEmail: opts.requesterEmail,
    organizationName: opts.organizationName,
  });

  return organizerStatusEmailTemplate({
    greeting: opts.greeting,
    subject: copy.subject,
    title: copy.title,
    bodyHtml: `${copy.body}<p style="margin-top: 20px; font-size: 14px; color: #475569;">${locale === "en" ? "Open the Team page to review the request." : "Abre la página Equipo para revisar la solicitud."}</p>`,
    cta: locale === "en" ? "Review request" : "Revisar solicitud",
    ctaUrl: opts.teamUrl,
    orgName: opts.orgName,
    locale,
  });
}

export function getOrganizerApprovedEmailTemplate(opts: {
  greeting: string;
  organizationName: string;
  loginUrl: string;
  orgName?: string;
  locale?: MailLocale;
}) {
  const locale = opts.locale ?? "es";
  const copy = organizerApprovedEmailCopy(locale, { organizationName: opts.organizationName });

  return organizerStatusEmailTemplate({
    greeting: opts.greeting,
    subject: copy.subject,
    title: copy.title,
    bodyHtml: copy.body,
    cta: copy.cta,
    ctaUrl: opts.loginUrl,
    orgName: opts.orgName,
    locale,
  });
}

export function getOrganizerRejectedEmailTemplate(opts: {
  greeting: string;
  organizationName: string;
  orgName?: string;
  locale?: MailLocale;
}) {
  const locale = opts.locale ?? "es";
  const copy = organizerRejectedEmailCopy(locale, { organizationName: opts.organizationName });

  return organizerStatusEmailTemplate({
    greeting: opts.greeting,
    subject: copy.subject,
    title: copy.title,
    bodyHtml: copy.body,
    orgName: opts.orgName,
    locale,
  });
}
