import { db } from "@/lib/db";
import { payments, platformTransactions, registrations } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import {
  getOrganizerPlanForEvent,
  getPlatformFee,
} from "@/lib/billing/enforce";
import { SubscriptionService } from "@/lib/billing/subscription.service";
import type { ResolvedPlan } from "@/lib/billing/types";

type Tx = Parameters<typeof SubscriptionService.recordPlatformTransactionTx>[0];

/**
 * Comisión Evora por inscrito/pago de evento.
 * fee = % del monto (commissionPercent) + fijo × N inscritos (commissionPerRegistration).
 */
export function computeEventCommissionFee(
  amount: number,
  plan: ResolvedPlan,
  inscriptionCount = 1,
): number {
  const percentPart = getPlatformFee(amount, plan);
  const fixed =
    Math.max(0, Number(plan.commissionPerRegistration ?? 0)) *
    Math.max(1, inscriptionCount);
  const fee = percentPart + fixed;
  if (!Number.isFinite(fee) || fee <= 0) return 0;
  return Math.round(fee * 100) / 100;
}

async function countPaidInscriptions(
  registrationId: string,
  tx?: Tx,
): Promise<number> {
  const runner = tx ?? db;
  const [guests] = await runner
    .select({ total: sql<number>`count(*)::int` })
    .from(registrations)
    .where(eq(registrations.parentRegistrationId, registrationId));

  return 1 + Number(guests?.total ?? 0);
}

async function findExistingCommission(paymentId: string, tx?: Tx) {
  const runner = tx ?? db;
  const [existing] = await runner
    .select({
      id: platformTransactions.id,
      amount: platformTransactions.amount,
    })
    .from(platformTransactions)
    .where(
      and(
        eq(platformTransactions.type, "commission"),
        eq(platformTransactions.paymentId, paymentId),
      ),
    )
    .limit(1);
  return existing ?? null;
}

/**
 * Idempotente: escribe platformFee en el pago + ledger commission.
 * Llamar cuando un pago de evento pasa a approved (Culqi o manual).
 */
export async function settlePlatformCommissionForApprovedPayment(input: {
  paymentId: string;
  registrationId: string;
  eventId: string;
  eventTitle: string;
  organizerId: string;
  amount: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  tx?: Tx;
}): Promise<{ fee: number; recorded: boolean; skippedReason?: string }> {
  const existing = await findExistingCommission(input.paymentId, input.tx);
  if (existing) {
    return {
      fee: Number(existing.amount),
      recorded: false,
      skippedReason: "already_recorded",
    };
  }

  const plan = await getOrganizerPlanForEvent(input.eventId);
  if (!plan) {
    return { fee: 0, recorded: false, skippedReason: "platform_owned_event" };
  }

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { fee: 0, recorded: false, skippedReason: "zero_amount" };
  }

  const inscriptionCount = await countPaidInscriptions(
    input.registrationId,
    input.tx,
  );
  const fee = computeEventCommissionFee(amount, plan, inscriptionCount);
  if (fee <= 0) {
    return { fee: 0, recorded: false, skippedReason: "zero_commission_plan" };
  }

  const runner = input.tx ?? db;
  await runner
    .update(payments)
    .set({
      platformFee: String(fee),
      updatedAt: new Date(),
    })
    .where(eq(payments.id, input.paymentId));

  const payload = {
    type: "commission" as const,
    amount: fee,
    currency: input.currency ?? "PEN",
    userId: input.organizerId,
    paymentId: input.paymentId,
    description: `Comisión por inscrito(s) · ${input.eventTitle} (${inscriptionCount} inscrito${inscriptionCount === 1 ? "" : "s"})`,
    metadata: {
      eventId: input.eventId,
      registrationId: input.registrationId,
      inscriptionCount,
      commissionPercent: plan.commissionPercent,
      commissionPerRegistration: plan.commissionPerRegistration ?? 0,
      ticketAmount: amount,
      ...input.metadata,
    },
  };

  if (input.tx) {
    await SubscriptionService.recordPlatformTransactionTx(input.tx, payload);
  } else {
    await SubscriptionService.recordPlatformTransaction(payload);
  }

  return { fee, recorded: true };
}
