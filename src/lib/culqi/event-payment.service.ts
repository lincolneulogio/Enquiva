import { db } from "@/lib/db";
import { payments, registrations, events, tickets } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { PaymentService } from "@/services/payments/payment.service";
import { getCulqiCredentialsForEvent } from "@/lib/culqi/capabilities";
import { getOrganizerPlanForEvent, getPlatformFee } from "@/lib/billing/enforce";
import { SubscriptionService } from "@/lib/billing/subscription.service";
import { invalidateAdminDashboardStatsCache } from "@/lib/analytics/admin";

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

export class CulqiEventPaymentService {
  static async findPaymentByChargeId(chargeId: string) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.gatewayChargeId, chargeId))
      .limit(1);
    return payment ?? null;
  }

  static async findPaymentByOrderId(orderId: string) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.gatewayOrderId, orderId))
      .limit(1);
    return payment ?? null;
  }

  static async findPaymentById(paymentId: string) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);
    return payment ?? null;
  }

  /**
   * Aprueba un pago de evento tras cargo Culqi exitoso. Idempotente por gatewayChargeId.
   */
  static async fulfillApprovedCharge(input: {
    paymentId: string;
    chargeId: string;
    gatewayStatus: string;
    platformFee?: number | null;
    notes?: string;
  }) {
    const payment = await this.findPaymentById(input.paymentId);
    if (!payment) return { handled: false, reason: "payment_not_found" as const };

    if (payment.status === "approved") {
      return { handled: true, idempotent: true, paymentId: payment.id };
    }

    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, payment.registrationId))
      .limit(1);

    if (!registration) return { handled: false, reason: "registration_not_found" as const };

    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, registration.eventId))
      .limit(1);

    if (!event) return { handled: false, reason: "event_not_found" as const };

    await db
      .update(payments)
      .set({
        method: "culqi",
        gatewayProvider: "culqi",
        gatewayChargeId: input.chargeId,
        gatewayStatus: input.gatewayStatus,
        platformFee:
          input.platformFee != null && input.platformFee > 0
            ? String(input.platformFee)
            : payment.platformFee,
        reference: input.chargeId,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    if (input.platformFee && input.platformFee > 0 && !payment.platformFee) {
      await SubscriptionService.recordPlatformTransaction({
        type: "commission",
        amount: input.platformFee,
        userId: event.organizerId,
        paymentId: payment.id,
        description: `Comisión plataforma evento ${event.title}`,
        metadata: { chargeId: input.chargeId },
      });
    }

    await PaymentService.updatePaymentStatus(event.organizerId, "organizer", {
      paymentId: payment.id,
      status: "approved",
      notes: input.notes ?? "Aprobado automáticamente vía Culqi",
    });

    return { handled: true, idempotent: false, paymentId: payment.id };
  }

  /**
   * Procesa webhook de cargo exitoso buscando por metadata o chargeId.
   */
  static async reconcileChargeSuccess(charge: CulqiChargePayload) {
    const paymentId = charge.metadata?.paymentId;
    const chargeId = charge.id;

    if (paymentId) {
      return this.fulfillApprovedCharge({
        paymentId,
        chargeId,
        gatewayStatus: charge.outcome?.type ?? "venta_exitosa",
        notes: "Aprobado vía webhook Culqi (cargo)",
      });
    }

    const existing = await this.findPaymentByChargeId(chargeId);
    if (!existing) return { handled: false, reason: "unknown_charge" as const };

    if (existing.status === "approved") {
      return { handled: true, idempotent: true, paymentId: existing.id };
    }

    return this.fulfillApprovedCharge({
      paymentId: existing.id,
      chargeId,
      gatewayStatus: charge.outcome?.type ?? "venta_exitosa",
      notes: "Aprobado vía webhook Culqi (cargo)",
    });
  }

  /**
   * Marca pago como rechazado cuando Culqi notifica fallo de cargo.
   */
  static async reconcileChargeFailure(charge: CulqiChargePayload) {
    const paymentId = charge.metadata?.paymentId;
    const payment = paymentId
      ? await this.findPaymentById(paymentId)
      : await this.findPaymentByChargeId(charge.id);

    if (!payment || payment.status === "approved") {
      return { handled: false, reason: "no_action" as const };
    }

    await db
      .update(payments)
      .set({
        gatewayChargeId: charge.id,
        gatewayProvider: "culqi",
        gatewayStatus: charge.outcome?.type ?? "denegada",
        status: "rejected",
        notes: "Pago rechazado por Culqi (webhook)",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    await invalidateAdminDashboardStatsCache();
    return { handled: true, paymentId: payment.id };
  }

  /**
   * Revierte aprobación tras devolución o contracargo.
   */
  static async reconcileRefund(chargeId: string) {
    const payment = await this.findPaymentByChargeId(chargeId);
    if (!payment) return { handled: false, reason: "unknown_charge" as const };

    if (payment.status !== "approved") {
      return { handled: true, idempotent: true, paymentId: payment.id };
    }

    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, payment.registrationId))
      .limit(1);

    if (!registration) return { handled: false, reason: "registration_not_found" as const };

    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, registration.eventId))
      .limit(1);

    if (!event) return { handled: false, reason: "event_not_found" as const };

    await db.transaction(async (tx) => {
      await tx
        .update(payments)
        .set({
          status: "rejected",
          gatewayStatus: "refunded",
          notes: "Devolución o contracargo registrado vía Culqi",
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      await tx
        .update(tickets)
        .set({ status: "cancelled" })
        .where(eq(tickets.registrationId, payment.registrationId));
    });

    await invalidateAdminDashboardStatsCache();
    return { handled: true, paymentId: payment.id };
  }

  /**
   * Orden Culqi pagada (Yape / billeteras).
   */
  static async reconcileOrderPaid(order: CulqiOrderPayload) {
    const paymentId = order.metadata?.paymentId;
    const payment = paymentId
      ? await this.findPaymentById(paymentId)
      : await this.findPaymentByOrderId(order.id);

    if (!payment) return { handled: false, reason: "unknown_order" as const };

    if (payment.status === "approved") {
      return { handled: true, idempotent: true, paymentId: payment.id };
    }

    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, payment.registrationId))
      .limit(1);

    if (!registration) return { handled: false, reason: "registration_not_found" as const };

    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, registration.eventId))
      .limit(1);

    if (!event) return { handled: false, reason: "event_not_found" as const };

    const organizerPlan = await getOrganizerPlanForEvent(event.id);
    const amount = Number(payment.amount);
    const platformFee = organizerPlan ? getPlatformFee(amount, organizerPlan) : 0;

    await db
      .update(payments)
      .set({
        method: "culqi",
        gatewayProvider: "culqi",
        gatewayOrderId: order.id,
        gatewayStatus: order.state ?? "paid",
        platformFee: platformFee > 0 ? String(platformFee) : null,
        reference: order.id,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    if (platformFee > 0 && !payment.platformFee) {
      await SubscriptionService.recordPlatformTransaction({
        type: "commission",
        amount: platformFee,
        userId: event.organizerId,
        paymentId: payment.id,
        description: `Comisión plataforma evento ${event.title}`,
        metadata: { orderId: order.id },
      });
    }

    await PaymentService.updatePaymentStatus(event.organizerId, "organizer", {
      paymentId: payment.id,
      status: "approved",
      notes: "Aprobado automáticamente vía Culqi (orden/Yape)",
    });

    return { handled: true, idempotent: false, paymentId: payment.id };
  }

  /** Persiste orderId en el pago antes de abrir checkout. */
  static async attachOrderToPayment(paymentId: string, userId: string, orderId: string) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.id, paymentId), eq(payments.userId, userId)))
      .limit(1);

    if (!payment) throw new Error("Pago no encontrado");
    if (payment.status === "approved") throw new Error("Este pago ya fue aprobado");

    await db
      .update(payments)
      .set({
        gatewayOrderId: orderId,
        gatewayProvider: "culqi",
        method: "culqi",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));

    return { orderId };
  }

  static async resolveCredentialsForPayment(paymentId: string) {
    const payment = await this.findPaymentById(paymentId);
    if (!payment) return null;

    const [registration] = await db
      .select({ eventId: registrations.eventId })
      .from(registrations)
      .where(eq(registrations.id, payment.registrationId))
      .limit(1);

    if (!registration) return null;

    return getCulqiCredentialsForEvent(registration.eventId);
  }
}
