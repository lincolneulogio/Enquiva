import { transporter, sender } from "./transporter";
import { generatePdfBuffer } from "./pdf";
import {
  getVerificationCodeTemplate,
  getPasswordChangedTemplate,
  getPasswordResetTemplate,
  getTicketTemplate,
} from "./templates";
import { getSystemSettings } from "@/lib/settings";

async function safeSendMail(options: Parameters<typeof transporter.sendMail>[0]) {
  try {
    return await transporter.sendMail(options);
  } catch (error) {
    console.error(`[SMTP Error] Failed to send email to ${options.to}:`, error);
    return null;
  }
}

export async function sendVerificationCodeEmail(input: {
  email: string;
  name?: string | null;
  code: string;
}) {
  const { organizationName } = await getSystemSettings();
  const greeting = input.name ? `Hola ${input.name},` : "Hola,";
  const { subject, text, html } = getVerificationCodeTemplate(input.code, greeting, organizationName);

  await safeSendMail({
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

  await safeSendMail({
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

  await safeSendMail({
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

  await safeSendMail({
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

  await safeSendMail({
    from: sender(),
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
}) {
  const { organizationName } = await getSystemSettings();
  const greeting = input.name ? `Hola ${input.name},` : "Hola,";
  
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #0284c7; margin-bottom: 20px;">${input.subject}</h2>
      <p style="font-size: 16px;">${greeting}</p>
      <p style="font-size: 14px; white-space: pre-line;">${input.body}</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #777;">Este es un mensaje automático de la comunidad <strong>${organizationName}</strong>.</p>
    </div>
  `;

  await safeSendMail({
    from: sender(),
    to: input.email,
    subject: input.subject,
    text: `${greeting}\n\n${input.body}\n\nEste es un mensaje de la comunidad ${organizationName}.`,
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
    from: sender(),
    to: input.email,
    subject,
    text,
    html,
  });
}
