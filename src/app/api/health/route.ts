import { NextResponse } from "next/server";
import { env } from "@/env";
import { validateProductionMailConfig } from "@/lib/mail/config";
import { getMailProviderLabel } from "@/lib/mail/config";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  const mail = validateProductionMailConfig();
  let database = false;

  try {
    await db.execute(sql`SELECT 1`);
    database = true;
  } catch {
    database = false;
  }

  const isProd = process.env.NODE_ENV === "production";
  const checks = {
    database,
    cronSecret: Boolean(env.CRON_SECRET),
    culqi: Boolean(env.CULQI_SECRET_KEY),
    culqiWebhook: Boolean(env.CULQI_WEBHOOK_SECRET),
    mail: mail.ok,
    mailProvider: getMailProviderLabel(),
  };

  const ok = checks.database && checks.mail;

  const body = isProd
    ? {
        ok,
        environment: "production" as const,
        checks: {
          database: checks.database,
          mail: checks.mail,
          cronSecret: checks.cronSecret,
          culqi: checks.culqi,
          culqiWebhook: checks.culqiWebhook,
        },
        warnings: mail.warning ? [mail.warning] : [],
      }
    : {
        ok,
        environment: process.env.NODE_ENV ?? "development",
        checks,
        warnings: mail.warning ? [mail.warning] : [],
        crons: [
          "/api/cron/events",
          "/api/cron/subscriptions",
          "/api/cron/broadcasts",
          "/api/cron/registration-holds",
          "/api/cron/finance-digest",
          "/api/cron/backup",
        ],
      };

  return NextResponse.json(body, { status: ok ? 200 : 503 });
}
