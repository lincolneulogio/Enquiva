import { BRAND } from "@/lib/brand";
import {
  broadcastFooterNote,
  customNotificationFooter,
  welcomeEmailCopy,
  type MailLocale,
  type WelcomeAccountType,
} from "../locale-strings";
import { wrapInTemplate } from "./base-wrapper";

export function getBroadcastEmailTemplate(opts: {
  subject: string;
  message: string;
  eventTitle: string;
  greeting: string;
  orgName?: string;
  locale?: MailLocale;
}) {
  const locale = opts.locale ?? "es";
  const bodyHtml = `
    <div style="font-size: 15px; color: #475569; line-height: 1.6; font-family: 'Outfit', sans-serif; white-space: pre-wrap;">
      ${opts.message}
    </div>
  `;
  const footerNote = broadcastFooterNote(locale, opts.eventTitle);
  const emailSubject = `[${opts.eventTitle}] ${opts.subject}`;

  return {
    subject: emailSubject,
    text: `${opts.greeting}\n\n${opts.message}\n\n---\n${footerNote}`,
    html: wrapInTemplate(opts.subject, opts.greeting, bodyHtml, footerNote, opts.orgName, locale),
  };
}

export function getCustomNotificationEmailTemplate(opts: {
  subject: string;
  body: string;
  greeting: string;
  orgName?: string;
  locale?: MailLocale;
}) {
  const locale = opts.locale ?? "es";
  const bodyHtml = `
    <p style="font-size: 14px; white-space: pre-line; color: #475569; line-height: 1.6; font-family: 'Outfit', sans-serif;">
      ${opts.body}
    </p>
  `;
  const footerNote = customNotificationFooter(locale, opts.orgName ?? BRAND.name);

  return {
    subject: opts.subject,
    text: `${opts.greeting}\n\n${opts.body}`,
    html: wrapInTemplate(opts.subject, opts.greeting, bodyHtml, footerNote, opts.orgName, locale),
  };
}

export function getWelcomeEmailTemplate(opts: {
  greeting: string;
  accountType: WelcomeAccountType;
  loginUrl: string;
  orgName?: string;
  supportEmail?: string;
  locale?: MailLocale;
}) {
  const locale = opts.locale ?? "es";
  const copy = welcomeEmailCopy(locale, opts.accountType);
  const supportEmail = opts.supportEmail?.trim() || BRAND.supportEmail;

  const stepsHtml = copy.steps
    .map(
      (step, index) => `
        <tr>
          <td style="vertical-align: top; width: 28px; padding: 6px 0;">
            <div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; font-size: 12px; font-weight: 700; line-height: 24px; text-align: center; font-family: 'Outfit', sans-serif;">
              ${index + 1}
            </div>
          </td>
          <td style="padding: 6px 0 6px 10px; font-size: 14px; color: #475569; line-height: 1.6; font-family: 'Outfit', sans-serif;">
            ${step}
          </td>
        </tr>
      `,
    )
    .join("");

  const bodyHtml = `
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #475569; line-height: 1.6; font-family: 'Outfit', sans-serif;">
      ${copy.intro}
    </p>
    <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 20px; padding: 20px 22px; margin: 24px 0;">
      <p style="margin: 0 0 14px 0; font-size: 13px; font-weight: 700; color: #9a3412; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Outfit', sans-serif;">
        ${locale === "en" ? "Next steps" : "Próximos pasos"}
      </p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        ${stepsHtml}
      </table>
    </div>
    <div style="text-align: center; margin: 32px 0 8px 0;">
      <a href="${opts.loginUrl}" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 16px 36px; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 16px; display: inline-block; box-shadow: 0 10px 20px -5px rgba(234, 88, 12, 0.3); font-family: 'Outfit', sans-serif;">
        ${copy.cta}
      </a>
    </div>
  `;

  const footerNote =
    locale === "en"
      ? `Need help? Write to us at <a href="mailto:${supportEmail}" style="color:#ea580c;text-decoration:none;">${supportEmail}</a>`
      : `¿Necesitas ayuda? Escríbenos a <a href="mailto:${supportEmail}" style="color:#ea580c;text-decoration:none;">${supportEmail}</a>`;

  const textSteps = copy.steps.map((step, i) => `${i + 1}. ${step}`).join("\n");

  return {
    subject: copy.subject,
    text: `${opts.greeting}\n\n${copy.intro}\n\n${locale === "en" ? "Next steps" : "Próximos pasos"}:\n${textSteps}\n\n${copy.cta}: ${opts.loginUrl}\n\n${locale === "en" ? "Need help?" : "¿Necesitas ayuda?"} ${supportEmail}`,
    html: wrapInTemplate(copy.title, opts.greeting, bodyHtml, footerNote, opts.orgName, locale),
  };
}
