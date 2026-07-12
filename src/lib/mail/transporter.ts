import nodemailer from "nodemailer";
import { env } from "@/env";
import { validateProductionMailConfig } from "@/lib/mail/config";

const mailCheck = validateProductionMailConfig();

if (mailCheck.warning) {
  console.error(`[mail] ${mailCheck.warning}`);
}

if (!mailCheck.ok) {
  throw new Error(
    mailCheck.warning ??
      "SMTP de desarrollo (Mailtrap) no está permitido en producción. Configura Resend o SendGrid.",
  );
}

export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  requireTLS: true,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export function sender() {
  return `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM_EMAIL}>`;
}
