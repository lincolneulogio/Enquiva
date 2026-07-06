import nodemailer from "nodemailer";
import { env } from "@/env";
import { validateProductionMailConfig } from "@/lib/mail/config";

const mailCheck = validateProductionMailConfig();
if (mailCheck.warning) {
  console.warn(`[mail] ${mailCheck.warning}`);
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
