import { db } from "@/lib/db";
import { platformTransactions, users } from "@/lib/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

export type CommissionSettlementSummary = {
  totalCommission: number;
  transactionCount: number;
  byOrganizer: Array<{
    organizerId: string;
    organizerName: string | null;
    organizerEmail: string | null;
    total: number;
    count: number;
  }>;
  recent: Array<{
    id: string;
    amount: string;
    description: string | null;
    paymentId: string | null;
    userId: string | null;
    createdAt: Date;
  }>;
};

/**
 * Liquidación contable de comisiones de plataforma (para superadmin).
 * Nota: el cobro efectivo puede ser retención Culqi o facturación al organizador;
 * este panel refleja lo ganado y lo atribuido por organizador.
 */
export async function getCommissionSettlementSummary(): Promise<CommissionSettlementSummary> {
  const [[{ total }], [{ txnCount }]] = await Promise.all([
    db
      .select({
        total: sql<string>`COALESCE(SUM(${platformTransactions.amount}), 0)`,
      })
      .from(platformTransactions)
      .where(eq(platformTransactions.type, "commission")),
    db
      .select({ txnCount: sql<number>`count(*)::int` })
      .from(platformTransactions)
      .where(eq(platformTransactions.type, "commission")),
  ]);

  const byOrganizerRaw = await db
    .select({
      organizerId: platformTransactions.userId,
      organizerName: users.name,
      organizerEmail: users.email,
      total: sql<string>`COALESCE(SUM(${platformTransactions.amount}), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(platformTransactions)
    .leftJoin(users, eq(platformTransactions.userId, users.id))
    .where(
      and(
        eq(platformTransactions.type, "commission"),
        sql`${platformTransactions.userId} IS NOT NULL`,
      ),
    )
    .groupBy(platformTransactions.userId, users.name, users.email)
    .orderBy(sql`SUM(${platformTransactions.amount}) DESC`)
    .limit(20);

  const recent = await db
    .select({
      id: platformTransactions.id,
      amount: platformTransactions.amount,
      description: platformTransactions.description,
      paymentId: platformTransactions.paymentId,
      userId: platformTransactions.userId,
      createdAt: platformTransactions.createdAt,
    })
    .from(platformTransactions)
    .where(eq(platformTransactions.type, "commission"))
    .orderBy(desc(platformTransactions.createdAt))
    .limit(30);

  return {
    totalCommission: Number(total ?? 0),
    transactionCount: Number(txnCount ?? 0),
    byOrganizer: byOrganizerRaw.map((r) => ({
      organizerId: r.organizerId ?? "unknown",
      organizerName: r.organizerName,
      organizerEmail: r.organizerEmail,
      total: Number(r.total ?? 0),
      count: Number(r.count ?? 0),
    })),
    recent,
  };
}
