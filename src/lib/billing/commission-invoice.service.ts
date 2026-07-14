import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { commissionInvoices, platformTransactions, users } from "@/lib/db/schema";
import { sendCommissionInvoiceEmail } from "@/lib/mail";

/**
 * Facturación de comisiones de plataforma cobradas al organizador
 * (ledger = ganancia Evora; factura = cobro/documentación hacia el org).
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
    const conditions = [
      eq(platformTransactions.type, "commission"),
      eq(platformTransactions.userId, organizerId),
    ];
    if (periodStart) conditions.push(gte(platformTransactions.createdAt, periodStart));
    if (periodEnd) conditions.push(lte(platformTransactions.createdAt, periodEnd));

    const [row] = await db
      .select({
        total: sql<string>`coalesce(sum(${platformTransactions.amount}), 0)`,
      })
      .from(platformTransactions)
      .where(and(...conditions));

    return Number(row?.total ?? 0);
  }

  static async issueForOrganizer(input: {
    organizerId: string;
    createdBy: string;
    periodStart?: Date | null;
    periodEnd?: Date | null;
    notes?: string | null;
    sendEmail?: boolean;
  }) {
    const amount = await this.computeDueAmount(
      input.organizerId,
      input.periodStart ?? undefined,
      input.periodEnd ?? undefined,
    );

    if (amount <= 0) {
      throw new Error("No hay comisiones pendientes de facturar para este organizador");
    }

    const [organizer] = await db
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
    const [invoice] = await db
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
          "Factura automática de comisión de plataforma Evora (% + fijo por inscrito).",
        issuedAt: now,
        createdBy: input.createdBy,
        updatedAt: now,
      })
      .returning();

    if (input.sendEmail !== false && organizer.email) {
      await sendCommissionInvoiceEmail({
        email: organizer.email,
        name: organizer.name,
        amount,
        invoiceId: invoice.id,
        periodStart: input.periodStart ?? null,
        periodEnd: input.periodEnd ?? null,
      }).catch(() => undefined);
    }

    return invoice;
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
