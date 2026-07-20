import { and, desc, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db, type DBTransaction } from "@/lib/db";
import { commissionInvoices, platformTransactions, users } from "@/lib/db/schema";
import { sendCommissionInvoiceEmail } from "@/lib/mail";
import { calculateOutstandingCommission } from "@/lib/billing/commission-math";

/**
 * Facturación de comisiones de plataforma cobradas al organizador
 * (ledger = ganancia Enquiva; factura = cobro/documentación hacia el org).
 */
export class CommissionInvoiceService {
  static async listRecent(limit = 40) {
    return db
      .select({
        invoice: commissionInvoices,
        organizerName: users.name,
        organizerEmail: users.email,
      })
      .from(commissionInvoices)
      .leftJoin(users, eq(commissionInvoices.organizerId, users.id))
      .orderBy(desc(commissionInvoices.createdAt))
      .limit(limit);
  }

  /** Suma comisiones del ledger atribuidas a un organizador (userId en platform_transactions). */
  static async computeDueAmount(organizerId: string, periodStart?: Date, periodEnd?: Date) {
    return this.computeDueAmountWithRunner(db, organizerId, periodStart, periodEnd);
  }

  private static async computeDueAmountWithRunner(
    runner: typeof db | DBTransaction,
    organizerId: string,
    periodStart?: Date,
    periodEnd?: Date,
  ) {
    const conditions = [
      eq(platformTransactions.userId, organizerId),
      or(
        eq(platformTransactions.type, "commission"),
        and(
          eq(platformTransactions.type, "adjustment"),
          sql`${platformTransactions.metadata}->>'reason' = 'payment_refund'`,
        ),
      )!,
    ];
    if (periodStart) conditions.push(gte(platformTransactions.createdAt, periodStart));
    if (periodEnd) conditions.push(lte(platformTransactions.createdAt, periodEnd));

    const [row] = await runner
      .select({
        total: sql<string>`coalesce(sum(${platformTransactions.amount}), 0)`,
      })
      .from(platformTransactions)
      .where(and(...conditions));

    const invoiceConditions = [
      eq(commissionInvoices.organizerId, organizerId),
      inArray(commissionInvoices.status, ["issued", "paid"]),
      periodStart
        ? eq(commissionInvoices.periodStart, periodStart)
        : isNull(commissionInvoices.periodStart),
      periodEnd
        ? eq(commissionInvoices.periodEnd, periodEnd)
        : isNull(commissionInvoices.periodEnd),
    ];
    const [invoiced] = await runner
      .select({
        total: sql<string>`coalesce(sum(${commissionInvoices.amount}), 0)`,
      })
      .from(commissionInvoices)
      .where(and(...invoiceConditions));

    return calculateOutstandingCommission(
      Number(row?.total ?? 0),
      Number(invoiced?.total ?? 0),
    );
  }

  static async issueForOrganizer(input: {
    organizerId: string;
    createdBy: string;
    periodStart?: Date | null;
    periodEnd?: Date | null;
    notes?: string | null;
    sendEmail?: boolean;
  }) {
    const result = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${"commission-invoice:" + input.organizerId}))`,
      );
      const amount = await this.computeDueAmountWithRunner(
        tx,
        input.organizerId,
        input.periodStart ?? undefined,
        input.periodEnd ?? undefined,
      );

      if (amount <= 0) {
        throw new Error("No hay comisiones pendientes de facturar para este organizador");
      }

      const [organizer] = await tx
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          organizationId: users.organizationId,
        })
        .from(users)
        .where(eq(users.id, input.organizerId))
        .limit(1);

      if (!organizer) throw new Error("Organizador no encontrado");

      const now = new Date();
      const [invoice] = await tx
        .insert(commissionInvoices)
        .values({
          organizerId: input.organizerId,
          organizationId: organizer.organizationId,
          amount: amount.toFixed(2),
          currency: "PEN",
          status: "issued",
          periodStart: input.periodStart ?? null,
          periodEnd: input.periodEnd ?? null,
          notes:
            input.notes ??
            "Factura automática de comisión de plataforma Enquiva (% + fijo por inscrito).",
          issuedAt: now,
          createdBy: input.createdBy,
          updatedAt: now,
        })
        .returning();
      return { amount, organizer, invoice };
    });

    if (input.sendEmail !== false && result.organizer.email) {
      await sendCommissionInvoiceEmail({
        email: result.organizer.email,
        name: result.organizer.name,
        amount: result.amount,
        invoiceId: result.invoice.id,
        periodStart: input.periodStart ?? null,
        periodEnd: input.periodEnd ?? null,
      }).catch(() => undefined);
    }

    return result.invoice;
  }

  static async markPaid(invoiceId: string) {
    const [updated] = await db
      .update(commissionInvoices)
      .set({
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(commissionInvoices.id, invoiceId))
      .returning();

    if (!updated) throw new Error("Factura no encontrada");
    return updated;
  }
}
