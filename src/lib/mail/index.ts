import nodemailer from "nodemailer";
import { env } from "@/env";

const transporter = nodemailer.createTransport({
  host: env.MAILTRAP_HOST,
  port: env.MAILTRAP_PORT,
  secure: false,
  requireTLS: true,
  auth: {
    user: env.MAILTRAP_USER,
    pass: env.MAILTRAP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

function sender() {
  return `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM_EMAIL}>`;
}

export async function sendVerificationCodeEmail(input: {
  email: string;
  name?: string | null;
  code: string;
}) {
  const greeting = input.name ? `Hola ${input.name},` : "Hola,";

  await transporter.sendMail({
    from: sender(),
    to: input.email,
    subject: "Confirma tu cuenta con el código de 6 dígitos",
    text: `${greeting}\n\nTu código de confirmación es: ${input.code}\n\nEste código expira en 15 minutos. Si no lo solicitaste, ignora este mensaje.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>${greeting}</p>
        <p>Tu código de confirmación es:</p>
        <div style="font-size:32px;letter-spacing:6px;font-weight:700;padding:18px 24px;background:#f3f4f6;border-radius:14px;display:inline-block">${input.code}</div>
        <p style="margin-top:20px">Este código expira en 15 minutos. Si no lo solicitaste, ignora este mensaje.</p>
      </div>
    `,
  });
}

export async function sendPasswordChangedEmail(input: {
  email: string;
  name?: string | null;
}) {
  const greeting = input.name ? `Hola ${input.name},` : "Hola,";

  await transporter.sendMail({
    from: sender(),
    to: input.email,
    subject: "Tu contraseña ha sido actualizada",
    text: `${greeting}\n\nTe confirmamos que tu contraseña fue actualizada correctamente.\n\nSi no realizaste este cambio, contacta al soporte de inmediato.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>${greeting}</p>
        <p>Te confirmamos que tu contraseña fue <strong>actualizada correctamente</strong>.</p>
        <p style="margin-top:16px;padding:12px 16px;background:#fef2f2;border-radius:10px;font-size:13px;color:#991b1b">
          ⚠ Si no realizaste este cambio, contacta al soporte de inmediato.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(input: {
  email: string;
  name?: string | null;
  url: string;
}) {
  const greeting = input.name ? `Hola ${input.name},` : "Hola,";

  await transporter.sendMail({
    from: sender(),
    to: input.email,
    subject: "Restablece tu contraseña",
    text: `${greeting}\n\nRecibimos una solicitud para restablecer tu contraseña. Abre este enlace: ${input.url}\n\nSi no lo solicitaste, ignora este mensaje.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>${greeting}</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p><a href="${input.url}">Restablecer contraseña</a></p>
        <p style="margin-top:20px">Si no lo solicitaste, ignora este mensaje.</p>
      </div>
    `,
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

  const qrHtml = input.qrDataUrl
    ? `<div style="margin:12px 0"><img src="${input.qrDataUrl}" alt="QR" style="width:220px;height:220px;border-radius:12px"/></div>`
    : "";

  await transporter.sendMail({
    from: sender(),
    to: input.email,
    subject: `Tu ticket para ${input.eventTitle}`,
    text: `${greeting}\n\nAdjuntamos tu ticket para: ${input.eventTitle}\n\nAccede: ${input.ticketUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>${greeting}</p>
        <p>Adjuntamos tu ticket para: <strong>${input.eventTitle}</strong></p>
        ${qrHtml}
        <p>Código del ticket: <strong>${input.code ?? "-"}</strong></p>
        <p><a href="${input.ticketUrl}">Ver ticket online</a></p>
      </div>
    `,
  });
}

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function buildSimplePdf(lines: string[]) {
  const contentLines = [
    "BT",
    "/F1 18 Tf",
    "72 760 Td",
    ...lines.flatMap((line, index) => {
      const safeLine = escapePdfText(line);
      if (index === 0) {
        return [`(${safeLine}) Tj`];
      }
      return ["0 -24 Td", `(${safeLine}) Tj`];
    }),
    "ET",
  ];

  const content = contentLines.join("\n");
  const contentLength = Buffer.byteLength(content, "utf8");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${contentLength} >> stream\n${content}\nendstream endobj`,
  ];

  const header = "%PDF-1.4\n";
  let pdf = header;
  const offsets: number[] = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${object}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

function generatePdfBuffer(opts: { eventTitle: string; code?: string; qrDataUrl?: string }) {
  const lines = [
    opts.eventTitle,
    `Código: ${opts.code ?? "-"}`,
    "Ticket emitido por SistemaEventsFIN",
    opts.qrDataUrl ? "QR disponible en el correo HTML" : "",
  ].filter(Boolean);

  return buildSimplePdf(lines);
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
  const pdfBuffer = await generatePdfBuffer({ eventTitle: input.eventTitle, code: input.code, qrDataUrl: input.qrDataUrl });

  const qrHtml = input.qrDataUrl
    ? `<div style="margin:12px 0"><img src="${input.qrDataUrl}" alt="QR" style="width:220px;height:220px;border-radius:12px"/></div>`
    : "";

  await transporter.sendMail({
    from: sender(),
    to: input.email,
    subject: `Tu ticket para ${input.eventTitle}`,
    text: `${greeting}\n\nAdjuntamos tu ticket para: ${input.eventTitle}\n\nAccede: ${input.ticketUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>${greeting}</p>
        <p>Adjuntamos tu ticket para: <strong>${input.eventTitle}</strong></p>
        ${qrHtml}
        <p>Código del ticket: <strong>${input.code ?? "-"}</strong></p>
        <p><a href="${input.ticketUrl}">Ver ticket online</a></p>
      </div>
    `,
    attachments: [
      { filename: `${input.eventTitle}-ticket.pdf`, content: pdfBuffer },
    ],
  });
}
