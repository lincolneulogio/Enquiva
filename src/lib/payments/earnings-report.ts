import { and, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, payments, registrations, users } from "@/lib/db/schema";

export type EarningsReportScope =
  | { mode: "organizer"; organizerId: string }
  | { mode: "organization"; organizationId: string }
  | { mode: "platform" };

export type EarningsReportFilters = {
  eventId?: string | null;
  category?: string | null;
  status?: "pending" | "approved" | "rejected" | null;
  fromDate?: string | null;
  toDate?: string | null;
};

export type EarningsBreakdownRow = {
  eventId: string;
  eventTitle: string;
  organizerId: string;
  organizerName: string;
  currency: string;
  approvedGross: number;
  platformCommission: number;
  organizerNet: number;
  pendingGross: number;
  approvedPayments: number;
  pendingPayments: number;
  unsettledApprovedPayments: number;
};

export type EarningsCurrencySummary = {
  currency: string;
  approvedGross: number;
  platformCommission: number;
  organizerNet: number;
  pendingGross: number;
  approvedPayments: number;
  pendingPayments: number;
  unsettledApprovedPayments: number;
};

export type PaymentEarningsReport = {
  currencies: EarningsCurrencySummary[];
  events: EarningsBreakdownRow[];
};

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateEarnings(input: {
  approvedGross: number;
  platformCommission: number;
}) {
  const approvedGross = roundMoney(input.approvedGross);
  const platformCommission = roundMoney(input.platformCommission);
  return {
    approvedGross,
    platformCommission,
    organizerNet: roundMoney(approvedGross - platformCommission),
  };
}

function parseDateBoundary(value: string | null | undefined, endOfDay: boolean) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function buildEarningsReportConditions(
  scope: EarningsReportScope,
  filters: EarningsReportFilters,
): SQL[] {
  const conditions: SQL[] = [];

  if (scope.mode === "organizer") {
    conditions.push(eq(events.organizerId, scope.organizerId));
  } else if (scope.mode === "organization") {
    conditions.push(eq(events.organizationId, scope.organizationId));
  }

  if (filters.eventId) conditions.push(eq(events.id, filters.eventId));
  if (filters.category) conditions.push(eq(events.category, filters.category));
  if (filters.status) conditions.push(eq(payments.status, filters.status));

  const fromDate = parseDateBoundary(filters.fromDate, false);
  const toDate = parseDateBoundary(filters.toDate, true);
  if (fromDate) conditions.push(gte(payments.createdAt, fromDate));
  if (toDate) conditions.push(lte(payments.createdAt, toDate));
  return conditions;
}

export async function getPaymentEarningsReport(
  scope: EarningsReportScope,
  filters: EarningsReportFilters,
): Promise<PaymentEarningsReport> {
  const conditions = buildEarningsReportConditions(scope, filters);

  const rows = await db
    .select({
      eventId: events.id,
      eventTitle: events.title,
      organizerId: events.organizerId,
      organizerName: users.name,
      currency: payments.currency,
      approvedGross: sql<string>`
        coalesce(sum(case when ${payments.status} = 'approved' then ${payments.amount} else 0 end), 0)
      `,
      platformCommission: sql<string>`
        coalesce(sum(case when ${payments.status} = 'approved' then coalesce(${payments.platformFee}, 0) else 0 end), 0)
      `,
      pendingGross: sql<string>`
        coalesce(sum(case when ${payments.status} = 'pending' then ${payments.amount} else 0 end), 0)
      `,
      approvedPayments: sql<number>`
        count(*) filter (where ${payments.status} = 'approved')::int
      `,
      pendingPayments: sql<number>`
        count(*) filter (where ${payments.status} = 'pending')::int
      `,
      unsettledApprovedPayments: sql<number>`
        count(*) filter (
          where ${payments.status} = 'approved' and ${payments.platformFee} is null
        )::int
      `,
    })
    .from(payments)
    .innerJoin(registrations, eq(payments.registrationId, registrations.id))
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(users, eq(events.organizerId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(
      events.id,
      events.title,
      events.organizerId,
      users.name,
      payments.currency,
    )
    .orderBy(events.title);

  const eventRows: EarningsBreakdownRow[] = rows.map((row) => {
    const earnings = calculateEarnings({
      approvedGross: Number(row.approvedGross),
      platformCommission: Number(row.platformCommission),
    });
    return {
      eventId: row.eventId,
      eventTitle: row.eventTitle,
      organizerId: row.organizerId,
      organizerName: row.organizerName,
      currency: row.currency,
      ...earnings,
      pendingGross: roundMoney(Number(row.pendingGross)),
      approvedPayments: Number(row.approvedPayments),
      pendingPayments: Number(row.pendingPayments),
      unsettledApprovedPayments: Number(row.unsettledApprovedPayments),
    };
  });

  const byCurrency = new Map<string, EarningsCurrencySummary>();
  for (const row of eventRows) {
    const current = byCurrency.get(row.currency) ?? {
      currency: row.currency,
      approvedGross: 0,
      platformCommission: 0,
      organizerNet: 0,
      pendingGross: 0,
      approvedPayments: 0,
      pendingPayments: 0,
      unsettledApprovedPayments: 0,
    };
    current.approvedGross = roundMoney(current.approvedGross + row.approvedGross);
    current.platformCommission = roundMoney(
      current.platformCommission + row.platformCommission,
    );
    current.organizerNet = roundMoney(current.organizerNet + row.organizerNet);
    current.pendingGross = roundMoney(current.pendingGross + row.pendingGross);
    current.approvedPayments += row.approvedPayments;
    current.pendingPayments += row.pendingPayments;
    current.unsettledApprovedPayments += row.unsettledApprovedPayments;
    byCurrency.set(row.currency, current);
  }

  return {
    currencies: [...byCurrency.values()].sort((a, b) =>
      a.currency.localeCompare(b.currency),
    ),
    events: eventRows.sort((a, b) => b.organizerNet - a.organizerNet),
  };
}
