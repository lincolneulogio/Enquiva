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

function isLocalAppUrl(url = env.NEXT_PUBLIC_APP_URL): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

/**
 * Hard-fail Mailtrap only on real deployed production — not during `next build`
 * nor local `next start` with localhost APP_URL.
 */
export function shouldEnforceProductionMail(): boolean {
  if (process.env.NEXT_PHASE === "phase-production-build") return false;
  if (process.env.NODE_ENV !== "production") return false;
  if (isLocalAppUrl()) return false;
  return true;
}

/** Advertencia / bloqueo si producción desplegada sigue usando Mailtrap. */
export function validateProductionMailConfig(): { ok: boolean; warning?: string } {
  if (!isDevMailProvider()) return { ok: true };
  if (process.env.NODE_ENV !== "production") return { ok: true };

  const warning =
    "SMTP apunta a Mailtrap en producción. Configura Resend o SendGrid (ver docs/operaciones).";

  if (!shouldEnforceProductionMail()) {
    return { ok: true, warning };
  }

  return { ok: false, warning };
}
