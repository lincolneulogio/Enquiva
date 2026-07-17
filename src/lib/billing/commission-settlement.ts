import { db } from "@/lib/db";
import { platformTransactions, users } from "@/lib/db/schema";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { calculateNetCommission } from "@/lib/billing/commission-math";

export type CommissionSettlementSummary = {
  grossCommission: number;
  refundReversals: number;
  totalCommission: number;
  transactionCount: number;
  unlinkedCommission: number;
  unlinkedCommissionCount: number;
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
    type: string;
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
  const ledgerCondition = or(
    eq(platformTransactions.type, "commission"),
    and(
      eq(platformTransactions.type, "adjustment"),
      sql`${platformTransactions.metadata}->>'reason' = 'payment_refund'`,
    ),
  )!;

  const [[totals], [unlinked], [{ txnCount }]] = await Promise.all([
    db
      .select({
        gross: sql<string>`COALESCE(SUM(CASE WHEN ${platformTransactions.type} = 'commission' THEN ${platformTransactions.amount} ELSE 0 END), 0)`,
        reversals: sql<string>`COALESCE(ABS(SUM(CASE WHEN ${platformTransactions.type} = 'adjustment' THEN ${platformTransactions.amount} ELSE 0 END)), 0)`,
      })
      .from(platformTransactions)
      .where(ledgerCondition),
    db
      .select({
        total: sql<string>`COALESCE(SUM(${platformTransactions.amount}), 0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(platformTransactions)
      .where(
        and(
          eq(platformTransactions.type, "commission"),
          sql`${platformTransactions.paymentId} IS NULL`,
        ),
      ),
    db
      .select({ txnCount: sql<number>`count(*)::int` })
      .from(platformTransactions)
      .where(ledgerCondition),
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
        ledgerCondition,
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
      type: platformTransactions.type,
      description: platformTransactions.description,
      paymentId: platformTransactions.paymentId,
      userId: platformTransactions.userId,
      createdAt: platformTransactions.createdAt,
    })
    .from(platformTransactions)
    .where(ledgerCondition)
    .orderBy(desc(platformTransactions.createdAt))
    .limit(30);

  return {
    grossCommission: Number(totals?.gross ?? 0),
    refundReversals: Number(totals?.reversals ?? 0),
    totalCommission: calculateNetCommission(
      Number(totals?.gross ?? 0),
      Number(totals?.reversals ?? 0),
    ),
    transactionCount: Number(txnCount ?? 0),
    unlinkedCommission: Number(unlinked?.total ?? 0),
    unlinkedCommissionCount: Number(unlinked?.count ?? 0),
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
