import { transporter, sender } from "./transporter";
import { generatePdfBuffer } from "./pdf";
import {
  getVerificationCodeTemplate,
  getPasswordChangedTemplate,
  getPasswordResetTemplate,
  getTicketTemplate,
} from "./templates";
import { getSystemSettings } from "@/lib/settings";

export async function sendVerificationCodeEmail(input: {
  email: string;
  name?: string | null;
  code: string;
}) {
  const { organizationName } = await getSystemSettings();
  const greeting = input.name ? `Hola ${input.name},` : "Hola,";
  const { subject, text, html } = getVerificationCodeTemplate(input.code, greeting, organizationName);

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
  const { organizationName } = await getSystemSettings();
  const greeting = input.name ? `Hola ${input.name},` : "Hola,";
  const { subject, text, html } = getPasswordChangedTemplate(greeting, organizationName);

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
  const { organizationName } = await getSystemSettings();
  const greeting = input.name ? `Hola ${input.name},` : "Hola,";
  const { subject, text, html } = getPasswordResetTemplate(input.url, greeting, organizationName);

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

  const attachments: any[] = [];
  if (input.qrDataUrl && input.qrDataUrl.startsWith("data:image/")) {
    const base64Data = input.qrDataUrl.replace(/^data:image\/\w+;base64,/, "");
    attachments.push({
      filename: "qrcode.png",
      content: Buffer.from(base64Data, "base64"),
      cid: "qrcode",
    });
  }

  await transporter.sendMail({
    from: sender(),
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

  const attachments: any[] = [
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

  await transporter.sendMail({
    from: sender(),
    to: input.email,
    subject,
    text,
    html,
    attachments,
  });
}
