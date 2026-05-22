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