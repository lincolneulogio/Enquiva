import { env } from "@/env";

const DEV_MAIL_HOSTS = ["mailtrap", "sandbox.smtp"];

export function isDevMailProvider(host = env.SMTP_HOST): boolean {
  const normalized = host.toLowerCase();
  return DEV_MAIL_HOSTS.some((marker) => normalized.includes(marker));
}

export function getMailProviderLabel(): "resend" | "sendgrid" | "mailtrap" | "smtp" {
  const host = env.SMTP_HOST.toLowerCase();
  if (host.includes("resend")) return "resend";
  if (host.includes("sendgrid")) return "sendgrid";
  if (isDevMailProvider()) return "mailtrap";
  return "smtp";
}

/** Advertencia si producción sigue usando Mailtrap. */
export function validateProductionMailConfig(): { ok: boolean; warning?: string } {
  if (process.env.NODE_ENV !== "production") return { ok: true };
  if (isDevMailProvider()) {
    return {
      ok: false,
      warning:
        "SMTP apunta a Mailtrap en producción. Configura Resend o SendGrid (ver docs/operaciones).",
    };
  }
  return { ok: true };
}
