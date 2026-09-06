import { db } from "@/lib/db";
import { registrations, payments } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { computeEventCommissionFee } from "@/lib/billing/platform-commission";
import type { ResolvedPlan } from "@/lib/billing/types";

export type CulqiChargePayload = {
  id: string;
  outcome?: { type?: string };
  metadata?: Record<string, string>;
  amount_refunded?: number;
  current_amount?: number;
};

export type CulqiOrderPayload = {
  id: string;
  state?: string;
  metadata?: Record<string, string>;
};

export type CulqiProcessResult = {
  status: number;
  body: Record<string, unknown>;
};

export type CulqiSessionUser = {
  id: string;
  email: string;
  name?: string | null;
};

export async function findPaymentByChargeId(chargeId: string) {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.gatewayChargeId, chargeId))
    .limit(1);
  return payment ?? null;
}

export async function findPaymentByOrderId(orderId: string) {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.gatewayOrderId, orderId))
    .limit(1);
  return payment ?? null;
}

export async function findPaymentById(paymentId: string) {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);
  return payment ?? null;
}

export async function resolvePlatformFeeForPayment(
  registrationId: string,
  amount: number,
  organizerPlan: ResolvedPlan | null,
) {
  if (!organizerPlan) return 0;
  const [guests] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(registrations)
    .where(eq(registrations.parentRegistrationId, registrationId));
  const inscriptionCount = 1 + Number(guests?.total ?? 0);
  return computeEventCommissionFee(amount, organizerPlan, inscriptionCount);
}
