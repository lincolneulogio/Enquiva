import { and, count, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, payments, platformTransactions } from "@/lib/db/schema";
import { formatCurrency } from "@/lib/utils";
import { getSystemSettings } from "@/lib/settings";
import { normalizePlatformLocale } from "@/lib/settings/platform-locale";
import {
  getCalendarDayUtcRange,
  getLocalHour,
  getPreviousDateKey,
} from "@/lib/datetime/zoned-day";
import { NotificationService, type NotificationPayload } from "./notification.service";
import { getSuperAdminUserIds } from "./notification-targets";

export type FinanceDigestSnapshot = {
  digestDate: string;
  timeZone: string;
  eventApprovedAmount: number;
  eventApprovedCount: number;
  eventPendingCount: number;
  eventRejectedCount: number;
  saasSubscriptionAmount: number;
  saasCommissionAmount: number;
  saasTotalAmount: number;
  currency: string;
};

const EFFECTIVE_APPROVED_AT = sql`coalesce(${payments.verifiedAt}, ${payments.updatedAt}, ${payments.createdAt})`;

export async function buildFinanceDigestSnapshot(input: {
  digestDate: string;
  timeZone: string;
}): Promise<FinanceDigestSnapshot> {
  const { start, endExclusive } = getCalendarDayUtcRange(input.digestDate, input.timeZone);

  const [[approved], [pending], [rejected], saasRows] = await Promise.all([
    db
      .select({
        total: sql<string>`coalesce(sum(${payments.amount}), '0')`,
        qty: count(),
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, "approved"),
          gte(EFFECTIVE_APPROVED_AT, start),
          lt(EFFECTIVE_APPROVED_AT, endExclusive),
        ),
      ),
    db
      .select({ qty: count() })
      .from(payments)
      .where(
        and(
          eq(payments.status, "pending"),
          gte(payments.createdAt, start),
          lt(payments.createdAt, endExclusive),
        ),
      ),
    db
      .select({ qty: count() })
      .from(payments)
      .where(
        and(
          eq(payments.status, "rejected"),
          gte(EFFECTIVE_APPROVED_AT, start),
          lt(EFFECTIVE_APPROVED_AT, endExclusive),
        ),
      ),
    db
      .select({
        type: platformTransactions.type,
        total: sql<string>`coalesce(sum(${platformTransactions.amount}), '0')`,
      })
      .from(platformTransactions)
      .where(
        and(
          gte(platformTransactions.createdAt, start),
          lt(platformTransactions.createdAt, endExclusive),
        ),
      )
      .groupBy(platformTransactions.type),
  ]);

  let saasSubscriptionAmount = 0;
  let saasCommissionAmount = 0;
  for (const row of saasRows) {
    const amount = Number(row.total ?? 0);
    if (row.type === "subscription") saasSubscriptionAmount += amount;
    if (row.type === "commission") saasCommissionAmount += amount;
  }

  return {
    digestDate: input.digestDate,
    timeZone: input.timeZone,
    eventApprovedAmount: Number(approved?.total ?? 0),
    eventApprovedCount: Number(approved?.qty ?? 0),
    eventPendingCount: Number(pending?.qty ?? 0),
    eventRejectedCount: Number(rejected?.qty ?? 0),
    saasSubscriptionAmount,
    saasCommissionAmount,
    saasTotalAmount: saasSubscriptionAmount + saasCommissionAmount,
    currency: "PEN",
  };
}

async function alreadySentDigest(digestDate: string): Promise<boolean> {
  const [row] = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.type, "finance_digest"),
        sql`${notifications.metadata}->>'digestDate' = ${digestDate}`,
      ),
    )
    .limit(1);
  return Boolean(row);
}

function buildDigestMessage(
  snapshot: FinanceDigestSnapshot,
  locale: "es" | "en",
): { title: string; message: string } {
  const money = (n: number) => formatCurrency(n, snapshot.currency, locale);
  const title =
    locale === "en" ? `Daily finance digest · ${snapshot.digestDate}` : `Resumen financiero · ${snapshot.digestDate}`;

  const lines =
    locale === "en"
      ? [
          `Events: ${money(snapshot.eventApprovedAmount)} approved (${snapshot.eventApprovedCount}) · ${snapshot.eventPendingCount} pending · ${snapshot.eventRejectedCount} rejected.`,
          `SaaS: ${money(snapshot.saasTotalAmount)} (subscriptions ${money(snapshot.saasSubscriptionAmount)}, commissions ${money(snapshot.saasCommissionAmount)}).`,
          `Timezone: ${snapshot.timeZone}.`,
        ]
      : [
          `Eventos: ${money(snapshot.eventApprovedAmount)} aprobados (${snapshot.eventApprovedCount}) · ${snapshot.eventPendingCount} pendientes · ${snapshot.eventRejectedCount} rechazados.`,
          `SaaS: ${money(snapshot.saasTotalAmount)} (suscripciones ${money(snapshot.saasSubscriptionAmount)}, comisiones ${money(snapshot.saasCommissionAmount)}).`,
          `Zona horaria: ${snapshot.timeZone}.`,
        ];

  return { title, message: lines.join(" ") };
}

export type FinanceDigestRunResult =
  | {
      skipped: true;
      reason: "disabled" | "outside_window" | "already_sent" | "no_recipients";
      digestDate?: string;
      localHour?: number;
    }
  | {
      skipped: false;
      digestDate: string;
      recipients: number;
      snapshot: FinanceDigestSnapshot;
    };

/**
 * Envía el resumen del día civil anterior a superadmins.
 * Pensado para cron horario: solo actúa en la hora local 00 (medianoche) salvo `force`.
 */
export async function runDailyFinanceDigest(options?: {
  force?: boolean;
  now?: Date;
}): Promise<FinanceDigestRunResult> {
  const settings = await getSystemSettings();
  if (!settings.alertDailyFinanceSummary && !options?.force) {
    return { skipped: true, reason: "disabled" };
  }

  const timeZone = settings.defaultTimezone;
  const now = options?.now ?? new Date();
  const localHour = getLocalHour(now, timeZone);

  if (!options?.force && localHour !== 0) {
    return { skipped: true, reason: "outside_window", localHour };
  }

  const digestDate = getPreviousDateKey(now, timeZone);

  if (!options?.force && (await alreadySentDigest(digestDate))) {
    return { skipped: true, reason: "already_sent", digestDate };
  }

  const recipientIds = await getSuperAdminUserIds();
  if (recipientIds.length === 0) {
    return { skipped: true, reason: "no_recipients", digestDate };
  }

  const snapshot = await buildFinanceDigestSnapshot({ digestDate, timeZone });
  const locale = normalizePlatformLocale(settings.defaultLocale);
  const { title, message } = buildDigestMessage(snapshot, locale);

  const payloads: NotificationPayload[] = recipientIds.map((userId) => ({
    userId,
    type: "finance_digest",
    title,
    message,
    metadata: {
      digestDate,
      timeZone,
      eventApprovedAmount: snapshot.eventApprovedAmount,
      eventApprovedCount: snapshot.eventApprovedCount,
      eventPendingCount: snapshot.eventPendingCount,
      eventRejectedCount: snapshot.eventRejectedCount,
      saasSubscriptionAmount: snapshot.saasSubscriptionAmount,
      saasCommissionAmount: snapshot.saasCommissionAmount,
      saasTotalAmount: snapshot.saasTotalAmount,
      currency: snapshot.currency,
    },
  }));

  await NotificationService.createMany(payloads);

  return {
    skipped: false,
    digestDate,
    recipients: recipientIds.length,
    snapshot,
  };
}
