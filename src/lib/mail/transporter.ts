import nodemailer from "nodemailer";
import { env } from "@/env";

export const transporter = nodemailer.createTransport({
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

export function sender() {
  return `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM_EMAIL}>`;
}
