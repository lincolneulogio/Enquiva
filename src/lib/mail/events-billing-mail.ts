import type { Attachment } from "nodemailer/lib/mailer";
import { getSystemSettings } from "@/lib/settings";
import { env } from "@/env";
import { generatePdfBuffer } from "./pdf";
import { mailGreeting, type MailLocale } from "./locale-strings";
import {
  getTicketTemplate,
  getBroadcastEmailTemplate,
  getCustomNotificationEmailTemplate,
} from "./templates";
import { safeSendMail, fromAddress } from "./safe-send";

type MailAttachment = Attachment;

export async function sendTicketEmail(input: {
  email: string;
  name?: string | null;
  eventTitle: string;
  ticketUrl: string;
  qrDataUrl?: string;
  code?: string;
}) {
  const { organizationName } = await getSystemSettings();
  const greeting = input.name ? `Hola ${input.name},` : "Hola,";
  const { subject, text, html } = getTicketTemplate({
    eventTitle: input.eventTitle,
    code: input.code,
    qrDataUrl: input.qrDataUrl,
    ticketUrl: input.ticketUrl,
    greeting,
    orgName: organizationName,
  });

  const attachments: MailAttachment[] = [];
  if (input.qrDataUrl && input.qrDataUrl.startsWith("data:image/")) {
    const base64Data = input.qrDataUrl.replace(/^data:image\/\w+;base64,/, "");
    attachments.push({
      filename: "qrcode.png",
      content: Buffer.from(base64Data, "base64"),
      cid: "qrcode",
    });
  }

  await safeSendMail({
    from: await fromAddress(),
    to: input.email,
    subject,
    text,
    html,
    attachments,
  });
}

export async function sendTicketEmailWithPdf(input: {
  email: string;
  name?: string | null;
  eventTitle: string;
  ticketUrl: string;
  qrDataUrl?: string;
  code?: string;
}) {
  const { organizationName } = await getSystemSettings();
  const greeting = input.name ? `Hola ${input.name},` : "Hola,";
  const pdfBuffer = await generatePdfBuffer({
    eventTitle: input.eventTitle,
    code: input.code,
    qrDataUrl: input.qrDataUrl,
    attendeeName: input.name,
  });

  const { subject, text, html } = getTicketTemplate({
    eventTitle: input.eventTitle,
    code: input.code,
    qrDataUrl: input.qrDataUrl,
    ticketUrl: input.ticketUrl,
    greeting,
    orgName: organizationName,
  });

  const attachments: MailAttachment[] = [
    { filename: `${input.eventTitle}-ticket.pdf`, content: pdfBuffer },
  ];

  if (input.qrDataUrl && input.qrDataUrl.startsWith("data:image/")) {
    const base64Data = input.qrDataUrl.replace(/^data:image\/\w+;base64,/, "");
    attachments.push({
      filename: "qrcode.png",
      content: Buffer.from(base64Data, "base64"),
      cid: "qrcode",
    });
  }

  await safeSendMail({
    from: await fromAddress(),
    to: input.email,
    subject,
    text,
    html,
    attachments,
  });
}

export async function sendCustomNotificationEmail(input: {
  email: string;
  name?: string | null;
  subject: string;
  body: string;
  locale?: MailLocale;
}) {
  const { organizationName } = await getSystemSettings();
  const locale = input.locale ?? "es";
  const greeting = mailGreeting(locale, input.name);
  const { subject, text, html } = getCustomNotificationEmailTemplate({
    subject: input.subject,
    body: input.body,
    greeting,
    orgName: organizationName,
    locale,
  });

  await safeSendMail({
    from: await fromAddress(),
    to: input.email,
    subject,
    text,
    html,
  });
}

export async function sendBroadcastEmail(input: {
  email: string;
  name?: string | null;
  subject: string;
  message: string;
  eventTitle: string;
  locale?: MailLocale;
}) {
  const { organizationName } = await getSystemSettings();
  const locale = input.locale ?? "es";
  const greeting = mailGreeting(locale, input.name);
  const { subject, text, html } = getBroadcastEmailTemplate({
    subject: input.subject,
    message: input.message,
    eventTitle: input.eventTitle,
    greeting,
    orgName: organizationName,
    locale,
  });

  await safeSendMail({
    from: await fromAddress(),
    to: input.email,
    subject,
    text,
    html,
  });
}

export async function sendSubscriptionRenewalReminderEmail(input: {
  email: string;
  name?: string | null;
  planName: string;
  daysRemaining: number;
  renewalDate: string;
  billingUrl: string;
  autoRenewEnabled: boolean;
}) {
  const { organizationName } = await getSystemSettings();
  const greeting = input.name ? `Hola ${input.name},` : "Hola,";
  const { getSubscriptionRenewalReminderTemplate } = await import("./templates");
  const { subject, text, html } = getSubscriptionRenewalReminderTemplate({
    greeting,
    planName: input.planName,
    daysRemaining: input.daysRemaining,
    renewalDate: input.renewalDate,
    billingUrl: input.billingUrl,
    autoRenewEnabled: input.autoRenewEnabled,
    orgName: organizationName,
  });

  await safeSendMail({
    from: await fromAddress(),
    to: input.email,
    subject,
    text,
    html,
  });
}

export async function sendCommissionInvoiceEmail(input: {
  email: string;
  name?: string | null;
  amount: number;
  invoiceId: string;
  periodStart?: Date | null;
  periodEnd?: Date | null;
}) {
  const greeting = input.name ? `Hola ${input.name},` : "Hola,";
  const periodLabel =
    input.periodStart || input.periodEnd
      ? `Periodo: ${input.periodStart?.toLocaleDateString("es-PE") ?? "…"} – ${input.periodEnd?.toLocaleDateString("es-PE") ?? "…"}`
      : "Periodo: acumulado hasta la fecha";
  const amountLabel = `S/ ${input.amount.toFixed(2)}`;
  const billingUrl = `${env.NEXT_PUBLIC_APP_URL}/organizer/billing`;
  const subject = `Factura de comisión Enquiva · ${amountLabel}`;
  const text = `${greeting}\n\nSe emitió una factura de comisión de plataforma por ${amountLabel}.\n${periodLabel}\nReferencia: ${input.invoiceId}\nCoordinar pago cash/transferencia o Culqi con el dueño de Enquiva.\n${billingUrl}`;
  const html = `<p>${greeting}</p><p>Se ha emitido una factura de comisión de plataforma por <strong>${amountLabel}</strong>.</p><p>${periodLabel}</p><p>Referencia: <code>${input.invoiceId}</code></p><p>Puedes coordinar el pago cash/transferencia o Culqi con el dueño de la plataforma.</p><p><a href="${billingUrl}">Ver billing</a></p>`;

  await safeSendMail({
    from: await fromAddress(),
    to: input.email,
    subject,
    text,
    html,
  });
}
