import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { env } from "@/env";
import { validateProductionMailConfig, isDevMailProvider } from "@/lib/mail/config";
import { db } from "@/lib/db";
import { platformSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decryptSecret } from "@/lib/crypto/secret";

export type ResolvedMailConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  /** env = variables de entorno; database = override Superadmin */
  source: "env" | "database";
};

const SETTINGS_ROW_ID = "default";

function envMailConfig(): ResolvedMailConfig {
  return {
    host: env.SMTP_HOST || "localhost",
    port: env.SMTP_PORT || 587,
    user: env.SMTP_USER || "",
    pass: env.SMTP_PASS || "",
    fromEmail: env.MAIL_FROM_EMAIL || "no-reply@enquiva.com",
    fromName: env.MAIL_FROM_NAME || "Enquiva",
    source: "env",
  };
}

function createTransportFromConfig(config: ResolvedMailConfig) {
  const check = validateProductionMailConfig(config.host);
  if (check.warning) {
    console.error(`[mail] ${check.warning}`);
  }
  if (!check.ok) {
    throw new Error(
      check.warning ??
        "SMTP de desarrollo (Mailtrap) no está permitido en producción. Configura Resend o SendGrid.",
    );
  }

  const options: SMTPTransport.Options = {
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    requireTLS: config.port !== 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  };

  return nodemailer.createTransport(options);
}

/** Resuelve SMTP efectivo: BD (si está activo) o .env. */
export async function resolveMailConfig(): Promise<ResolvedMailConfig> {
  try {
    const [row] = await db
      .select({
        smtpUseCustom: platformSettings.smtpUseCustom,
        smtpHost: platformSettings.smtpHost,
        smtpPort: platformSettings.smtpPort,
        smtpUser: platformSettings.smtpUser,
        smtpPassEncrypted: platformSettings.smtpPassEncrypted,
        smtpFromEmail: platformSettings.smtpFromEmail,
        smtpFromName: platformSettings.smtpFromName,
      })
      .from(platformSettings)
      .where(eq(platformSettings.id, SETTINGS_ROW_ID))
      .limit(1);

    if (row?.smtpUseCustom && row.smtpHost.trim()) {
      let pass = env.SMTP_PASS;
      if (row.smtpPassEncrypted.trim()) {
        try {
          pass = decryptSecret(row.smtpPassEncrypted);
        } catch (error) {
          console.error("[mail] No se pudo descifrar smtp_pass_encrypted; usando SMTP_PASS de env:", error);
        }
      }

      return {
        host: row.smtpHost.trim(),
        port: Number(row.smtpPort) > 0 ? Number(row.smtpPort) : 587,
        user: row.smtpUser.trim() || env.SMTP_USER,
        pass,
        fromEmail: row.smtpFromEmail.trim() || env.MAIL_FROM_EMAIL,
        fromName: row.smtpFromName.trim() || env.MAIL_FROM_NAME,
        source: "database",
      };
    }
  } catch (error) {
    console.error("[mail] Fallo al leer SMTP de plataforma; usando env:", error);
  }

  return envMailConfig();
}

let cached:
  | {
      fingerprint: string;
      transporter: ReturnType<typeof nodemailer.createTransport>;
      config: ResolvedMailConfig;
    }
  | null = null;

function fingerprintOf(config: ResolvedMailConfig): string {
  return [
    config.source,
    config.host,
    config.port,
    config.user,
    config.fromEmail,
    config.fromName,
    // No incluir pass en logs; basta como clave de cache
    config.pass.length,
    config.pass.slice(0, 2),
    config.pass.slice(-2),
  ].join("|");
}

export function invalidateMailTransporterCache(): void {
  cached = null;
}

export async function getMailTransporter() {
  const config = await resolveMailConfig();
  const fingerprint = fingerprintOf(config);
  if (cached && cached.fingerprint === fingerprint) {
    return cached.transporter;
  }
  const transporter = createTransportFromConfig(config);
  cached = { fingerprint, transporter, config };
  return transporter;
}

export async function getMailSender(): Promise<string> {
  const config = cached?.config ?? (await resolveMailConfig());
  return `"${config.fromName}" <${config.fromEmail}>`;
}

export async function getResolvedMailPublicInfo() {
  const config = await resolveMailConfig();
  return {
    host: config.host,
    port: config.port,
    user: config.user,
    fromEmail: config.fromEmail,
    fromName: config.fromName,
    source: config.source,
    isDevProvider: isDevMailProvider(config.host),
  };
}

if (typeof window === "undefined" && process.env.NEXT_PHASE !== "phase-production-build" && env.SMTP_HOST) {
  const bootCheck = validateProductionMailConfig(env.SMTP_HOST);
  if (bootCheck.warning) {
    console.error(`[mail] ${bootCheck.warning}`);
  }
  if (!bootCheck.ok) {
    console.warn(
      bootCheck.warning ??
        "SMTP de desarrollo (Mailtrap) no está permitido en producción. Configura Resend o SendGrid.",
    );
  }
}

/** @deprecated Prefer getMailSender() */
export function sender() {
  return `"${env.MAIL_FROM_NAME || 'Enquiva'}" <${env.MAIL_FROM_EMAIL || 'no-reply@enquiva.com'}>`;
}
