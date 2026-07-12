import {
  CulqiEventPaymentService,
  type CulqiChargePayload,
  type CulqiOrderPayload,
} from "@/lib/culqi/event-payment.service";
import { SubscriptionPaymentService } from "@/lib/billing/subscription-payment.service";
import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type CulqiWebhookEvent = {
  object?: string;
  id?: string;
  type?: string;
  data?: CulqiChargePayload | CulqiOrderPayload | string;
};

function parseEventData<T>(data: CulqiWebhookEvent["data"]): T | null {
  if (!data) return null;
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }
  return data as T;
}

async function fulfillSubscriptionCharge(charge: CulqiChargePayload & { amount?: number }) {
  const userId = charge.metadata?.userId;
  const planId = charge.metadata?.planId;
  if (!userId || !planId || !charge.id) {
    return { ok: true as const, skipped: "subscription_missing_metadata" };
  }

  const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  if (!plan) {
    return { ok: false as const, error: "plan_not_found" };
  }

  const amountFromCharge =
    typeof charge.amount === "number" && Number.isFinite(charge.amount)
      ? charge.amount / 100
      : Number(plan.priceMonthly);

  const result = await SubscriptionPaymentService.fulfillCulqiSubscriptionCharge({
    userId,
    planId: plan.id,
    planName: plan.name,
    amount: amountFromCharge,
    chargeId: charge.id,
  });

  return { ok: true as const, result };
}

/**
 * Procesa eventos Culqi: cargos, devoluciones, órdenes (Yape/billeteras).
 * Idempotente: reenvíos del webhook no duplican aprobaciones.
 */
export async function processCulqiWebhook(event: unknown) {
  const payload = (event ?? {}) as CulqiWebhookEvent;
  const type = payload.type ?? "";

  switch (type) {
    case "charge.creation.succeeded":
    case "charge.update.succeeded":
    case "charge.capture.succeeded": {
      const charge = parseEventData<CulqiChargePayload & { amount?: number }>(payload.data);
      if (!charge?.id) return { ok: true, skipped: "invalid_charge_payload" };

      if (charge.metadata?.type === "subscription") {
        return fulfillSubscriptionCharge(charge);
      }

      return {
        ok: true,
        result: await CulqiEventPaymentService.reconcileChargeSuccess(charge),
      };
    }

    case "charge.creation.failed":
    case "charge.update.failed":
    case "charge.capture.failed":
    case "charge.expired": {
      const charge = parseEventData<CulqiChargePayload>(payload.data);
      if (!charge?.id) return { ok: true, skipped: "invalid_charge_payload" };

      if (charge.metadata?.type === "subscription") {
        return { ok: true, skipped: "subscription_charge_failed" };
      }

      return {
        ok: true,
        result: await CulqiEventPaymentService.reconcileChargeFailure(charge),
      };
    }

    case "refund.creation.succeeded":
    case "refund.update.succeeded": {
      const refund = parseEventData<{ charge_id?: string }>(payload.data);
      const chargeId = refund?.charge_id;
      if (!chargeId) return { ok: true, skipped: "invalid_refund_payload" };

      const subPayment = await SubscriptionPaymentService.getByGatewayChargeId(chargeId);
      if (subPayment) {
        return { ok: true, skipped: "subscription_refund_manual" };
      }

      return {
        ok: true,
        result: await CulqiEventPaymentService.reconcileRefund(chargeId),
      };
    }

    case "order.status.changed": {
      const order = parseEventData<CulqiOrderPayload>(payload.data);
      if (!order?.id) return { ok: true, skipped: "invalid_order_payload" };

      if (order.state === "paid") {
        return {
          ok: true,
          result: await CulqiEventPaymentService.reconcileOrderPaid(order),
        };
      }

      return { ok: true, skipped: `order_state_${order.state ?? "unknown"}` };
    }

    default:
      return { ok: true, skipped: type || "unknown_event" };
  }
}
