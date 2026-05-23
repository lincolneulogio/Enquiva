import { transporter, sender } from "./transporter";
import { generatePdfBuffer } from "./pdf";
import {
  getVerificationCodeTemplate,
  getPasswordChangedTemplate,
  getPasswordResetTemplate,
  getTicketTemplate,
} from "./templates";

export async function sendVerificationCodeEmail(input: {
  email: string;
  name?: string | null;
  code: string;
}) {
  const greeting = input.name ? `Hola ${input.name},` : "Hola,";
  const { subject, text, html } = getVerificationCodeTemplate(input.code, greeting);

  await transporter.sendMail({
    from: sender(),
    to: input.email,
    subject,
    text,
    html,
  });
}

export async function sendPasswordChangedEmail(input: {
  email: string;
  name?: string | null;
}) {
  const greeting = input.name ? `Hola ${input.name},` : "Hola,";
  const { subject, text, html } = getPasswordChangedTemplate(greeting);

  await transporter.sendMail({
    from: sender(),
    to: input.email,
    subject,
    text,
    html,
  });
}

export async function sendPasswordResetEmail(input: {
  email: string;
  name?: string | null;
  url: string;
}) {
  const greeting = input.name ? `Hola ${input.name},` : "Hola,";
  const { subject, text, html } = getPasswordResetTemplate(input.url, greeting);

  await transporter.sendMail({
    from: sender(),
    to: input.email,
    subject,
    text,
    html,
  });
}

export async function sendTicketEmail(input: {
  email: string;
  name?: string | null;
  eventTitle: string;
  ticketUrl: string;
  qrDataUrl?: string;
  code?: string;
}) {
  const greeting = input.name ? `Hola ${input.name},` : "Hola,";
  const { subject, text, html } = getTicketTemplate({
    eventTitle: input.eventTitle,
    code: input.code,
    qrDataUrl: input.qrDataUrl,
    ticketUrl: input.ticketUrl,
    greeting,
  });

  await transporter.sendMail({
    from: sender(),
    to: input.email,
    subject,
    text,
    html,
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
  const greeting = input.name ? `Hola ${input.name},` : "Hola,";
  const pdfBuffer = await generatePdfBuffer({
    eventTitle: input.eventTitle,
    code: input.code,
    qrDataUrl: input.qrDataUrl,
  });

  const { subject, text, html } = getTicketTemplate({
    eventTitle: input.eventTitle,
    code: input.code,
    qrDataUrl: input.qrDataUrl,
    ticketUrl: input.ticketUrl,
    greeting,
  });

  await transporter.sendMail({
    from: sender(),
    to: input.email,
    subject,
    text,
    html,
    attachments: [
      { filename: `${input.eventTitle}-ticket.pdf`, content: pdfBuffer },
    ],
  });
}
