import { db } from "@/lib/db";
import { platformTransactions } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export type DashboardRevenueSnapshot = {
  eventRevenue: number;
  platformRevenue: number;
  subscriptionRevenue: number;
  commissionRevenue: number;
};

/** Ingresos SaaS (plataforma) vs entradas/transporte (pagos de eventos). */
export async function getDashboardRevenueSnapshot(eventRevenue: number): Promise<DashboardRevenueSnapshot> {
  const rows = await db
    .select({
      type: platformTransactions.type,
      reason: sql<string | null>`${platformTransactions.metadata}->>'reason'`,
      total: sql<string>`coalesce(sum(${platformTransactions.amount}), '0')`,
    })
    .from(platformTransactions)
    .groupBy(
      platformTransactions.type,
      sql`${platformTransactions.metadata}->>'reason'`,
    );

  let subscriptionRevenue = 0;
  let commissionRevenue = 0;
  let platformRevenue = 0;

  for (const row of rows) {
    const amount = Number(row.total ?? 0);
    platformRevenue += amount;
    if (row.type === "subscription") subscriptionRevenue += amount;
    if (
      row.type === "commission" ||
      (row.type === "adjustment" && row.reason === "payment_refund")
    ) {
      commissionRevenue += amount;
    }
  }

  return {
    eventRevenue,
    platformRevenue,
    subscriptionRevenue,
    commissionRevenue,
  };
}
