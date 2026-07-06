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

  const checks = {
    database,
    cronSecret: Boolean(env.CRON_SECRET),
    culqi: Boolean(env.CULQI_SECRET_KEY),
    mail: mail.ok,
    mailProvider: getMailProviderLabel(),
  };

  const ok = checks.database && checks.mail;

  return NextResponse.json(
    {
      ok,
      environment: process.env.NODE_ENV ?? "development",
      checks,
      warnings: mail.warning ? [mail.warning] : [],
      crons: ["/api/cron/events", "/api/cron/subscriptions", "/api/cron/broadcasts", "/api/cron/backup"],
    },
    { status: ok ? 200 : 503 },
  );
}
