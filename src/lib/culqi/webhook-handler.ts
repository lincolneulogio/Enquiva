import {
  CulqiEventPaymentService,
  type CulqiChargePayload,
  type CulqiOrderPayload,
} from "@/lib/culqi/event-payment.service";
import { SubscriptionPaymentService } from "@/lib/billing/subscription-payment.service";

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

/**
 * Procesa eventos Culqi: cargos, devoluciones, órdenes (Yape/billeteras).
 * Idempotente: reenvíos del webhook no duplican aprobaciones.
 */
export async function processCulqiWebhook(event: CulqiWebhookEvent) {
  const type = event.type ?? "";

  switch (type) {
    case "charge.creation.succeeded":
    case "charge.update.succeeded":
    case "charge.capture.succeeded": {
      const charge = parseEventData<CulqiChargePayload>(event.data);
      if (!charge?.id) return { ok: true, skipped: "invalid_charge_payload" };

      if (charge.metadata?.type === "subscription") {
        return { ok: true, skipped: "subscription_charge" };
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
      const charge = parseEventData<CulqiChargePayload>(event.data);
      if (!charge?.id) return { ok: true, skipped: "invalid_charge_payload" };

      if (charge.metadata?.type === "subscription") {
        return { ok: true, skipped: "subscription_charge" };
      }

      return {
        ok: true,
        result: await CulqiEventPaymentService.reconcileChargeFailure(charge),
      };
    }

    case "refund.creation.succeeded":
    case "refund.update.succeeded": {
      const refund = parseEventData<{ charge_id?: string }>(event.data);
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
      const order = parseEventData<CulqiOrderPayload>(event.data);
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
