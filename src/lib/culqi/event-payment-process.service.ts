import { db } from "@/lib/db";
import { payments, registrations, events } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getCulqiCredentialsForEvent } from "./capabilities";
import { assertPaymentCanBeApproved } from "@/lib/payments/payment-integrity";
import { canClaimGatewayOperation } from "@/lib/payments/financial-operation-policy";
import { createCulqiCharge, createCulqiOrder, getCulqiCharge, CULQI_ORDER_MIN_AMOUNT_PEN } from "./client";
import { getUserCulqiProfile } from "./customer-data.server";
import { mergeSessionCulqiProfile } from "./customer-data";
import { requirePlanFeature, getOrganizerPlanForEvent } from "@/lib/billing/enforce";
import { logCulqi } from "./observability";
import {
  findPaymentById,
  resolvePlatformFeeForPayment,
  type CulqiProcessResult,
  type CulqiSessionUser,
} from "./event-payment-types";
import { EventPaymentReconcileService } from "./event-payment-reconcile.service";

export class EventPaymentProcessService {
  /** Claim previo a crear objetos externos; evita dos cargos/órdenes concurrentes. */
  static async claimGatewayOperation(
    paymentId: string,
    userId: string,
    operation: "charge" | "order",
  ) {
    const [payment] = await db
      .select({
        userId: payments.userId,
        status: payments.status,
        gatewayStatus: payments.gatewayStatus,
      })
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (
      !payment ||
      !canClaimGatewayOperation({
        paymentUserId: payment.userId,
        requestingUserId: userId,
        paymentStatus: payment.status,
        gatewayStatus: payment.gatewayStatus,
      })
    ) {
      return false;
    }

    const [claimed] = await db
      .update(payments)
      .set({ gatewayStatus: `${operation}_processing`, updatedAt: new Date() })
      .where(
        and(
          eq(payments.id, paymentId),
          eq(payments.userId, userId),
          sql`${payments.status} != 'approved'`,
          sql`${payments.gatewayStatus} IS DISTINCT FROM 'charge_processing'`,
          sql`${payments.gatewayStatus} IS DISTINCT FROM 'order_processing'`,
        ),
      )
      .returning({ id: payments.id });

    return Boolean(claimed);
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
        gatewayStatus: "order_created",
        method: "culqi",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));

    return { orderId };
  }

  static async resolveCredentialsForPayment(paymentId: string) {
    const payment = await findPaymentById(paymentId);
    if (!payment) return null;

    const [registration] = await db
      .select({ eventId: registrations.eventId })
      .from(registrations)
      .where(eq(registrations.id, payment.registrationId))
      .limit(1);

    if (!registration) return null;

    return getCulqiCredentialsForEvent(registration.eventId);
  }

  /**
   * Orquesta cobro Culqi (charge) para un pago de evento pendiente.
   */
  static async processCharge(input: {
    user: CulqiSessionUser;
    paymentId: string;
    sourceId: string;
  }): Promise<CulqiProcessResult> {
    const payment = await findPaymentById(input.paymentId);
    if (!payment || payment.userId !== input.user.id) {
      return { status: 404, body: { error: "Pago no encontrado" } };
    }

    if (payment.status === "approved") {
      return {
        status: 200,
        body: {
          success: true,
          chargeId: payment.gatewayChargeId,
          idempotent: true,
        },
      };
    }

    if (payment.status !== "pending" && payment.status !== "rejected") {
      return { status: 409, body: { error: "Este pago no puede procesarse" } };
    }

    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, payment.registrationId))
      .limit(1);

    if (!registration) {
      return { status: 404, body: { error: "Inscripción no encontrada" } };
    }

    const organizerCulqi = await getCulqiCredentialsForEvent(registration.eventId);
    if (!organizerCulqi) {
      return {
        status: 503,
        body: { error: "El organizador no tiene Culqi configurado para este evento" },
      };
    }

    const [event] = await db.select().from(events).where(eq(events.id, registration.eventId)).limit(1);
    if (!event) {
      return { status: 404, body: { error: "Evento no encontrado" } };
    }
    assertPaymentCanBeApproved(payment, registration, event);

    const organizerPlan = await getOrganizerPlanForEvent(event.id);
    if (organizerPlan) {
      await requirePlanFeature(event.organizerId, "organizer", "culqi");
    }

    const amount = Number(payment.amount);
    const platformFee = await resolvePlatformFeeForPayment(
      registration.id,
      amount,
      organizerPlan,
    );

    if (payment.gatewayChargeId) {
      try {
        const existingCharge = await getCulqiCharge(payment.gatewayChargeId, organizerCulqi);
        if (existingCharge.outcome?.type === "venta_exitosa") {
          const result = await EventPaymentReconcileService.fulfillApprovedCharge({
            paymentId: payment.id,
            chargeId: existingCharge.id,
            gatewayStatus: existingCharge.outcome.type,
            platformFee,
            notes: "Aprobado automáticamente vía Culqi (reconciliación)",
          });
          return {
            status: 200,
            body: {
              success: true,
              chargeId: existingCharge.id,
              idempotent: result.idempotent ?? true,
            },
          };
        }
      } catch (reconcileError) {
        logCulqi("warn", {
          scope: "event",
          action: "charge.reconcile_failed",
          ok: false,
          message: reconcileError instanceof Error ? reconcileError.message : String(reconcileError),
          meta: { paymentId: payment.id },
        });
      }
    }

    const dbProfile = await getUserCulqiProfile(input.user.id);
    const customer = mergeSessionCulqiProfile(input.user, dbProfile);
    const claimed = await this.claimGatewayOperation(payment.id, input.user.id, "charge");
    if (!claimed) {
      return {
        status: 409,
        body: { error: "Ya hay una operación Culqi en proceso para este pago" },
      };
    }

    const charge = await createCulqiCharge(
      {
        amount,
        email: customer.email,
        sourceId: input.sourceId,
        customer,
        description: `Entrada: ${event.title}`,
        metadata: {
          paymentId: payment.id,
          registrationId: registration.id,
          eventId: event.id,
          paymentMethodId: organizerCulqi.paymentMethodId,
          platformFee: String(platformFee),
        },
      },
      { secretKey: organizerCulqi.secretKey, publicKey: organizerCulqi.publicKey },
    );

    if (charge.outcome?.type !== "venta_exitosa") {
      await EventPaymentReconcileService.reconcileChargeFailure(charge);
      return { status: 402, body: { error: "Pago rechazado por Culqi" } };
    }

    const result = await EventPaymentReconcileService.fulfillApprovedCharge({
      paymentId: payment.id,
      chargeId: charge.id,
      gatewayStatus: charge.outcome.type,
      platformFee,
      notes: "Aprobado automáticamente vía Culqi",
    });

    return {
      status: 200,
      body: {
        success: true,
        chargeId: charge.id,
        idempotent: result.idempotent ?? false,
      },
    };
  }

  /**
   * Orquesta creación de orden Culqi (Yape / billeteras) para un pago pendiente.
   */
  static async processOrder(input: {
    user: CulqiSessionUser;
    paymentId: string;
  }): Promise<CulqiProcessResult> {
    const payment = await findPaymentById(input.paymentId);
    if (!payment || payment.userId !== input.user.id) {
      return { status: 404, body: { error: "Pago no encontrado" } };
    }

    if (payment.status === "approved") {
      return {
        status: 200,
        body: {
          success: true,
          idempotent: true,
          orderId: payment.gatewayOrderId,
        },
      };
    }

    if (payment.gatewayOrderId) {
      return {
        status: 200,
        body: {
          success: true,
          orderId: payment.gatewayOrderId,
          enableYape: Number(payment.amount) >= CULQI_ORDER_MIN_AMOUNT_PEN,
        },
      };
    }

    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, payment.registrationId))
      .limit(1);

    if (!registration) {
      return { status: 404, body: { error: "Inscripción no encontrada" } };
    }

    const organizerCulqi = await getCulqiCredentialsForEvent(registration.eventId);
    if (!organizerCulqi) {
      return {
        status: 503,
        body: { error: "El organizador no tiene Culqi configurado para este evento" },
      };
    }

    const [event] = await db.select().from(events).where(eq(events.id, registration.eventId)).limit(1);
    if (!event) {
      return { status: 404, body: { error: "Evento no encontrado" } };
    }
    assertPaymentCanBeApproved(payment, registration, event);

    const organizerPlan = await getOrganizerPlanForEvent(event.id);
    if (organizerPlan) {
      await requirePlanFeature(event.organizerId, "organizer", "culqi");
    }

    const amount = Number(payment.amount);
    const enableYape = amount >= CULQI_ORDER_MIN_AMOUNT_PEN;

    const dbProfile = await getUserCulqiProfile(input.user.id);
    const customer = mergeSessionCulqiProfile(input.user, dbProfile);
    const claimed = await this.claimGatewayOperation(payment.id, input.user.id, "order");
    if (!claimed) {
      return {
        status: 409,
        body: { error: "Ya hay una operación Culqi en curso para este pago" },
      };
    }

    const order = await createCulqiOrder(
      {
        amount,
        email: customer.email,
        customer,
        description: `Entrada: ${event.title}`,
        orderNumber: payment.id.replace(/-/g, "").slice(0, 36),
        metadata: {
          paymentId: payment.id,
          registrationId: registration.id,
          eventId: event.id,
          paymentMethodId: organizerCulqi.paymentMethodId,
        },
      },
      { secretKey: organizerCulqi.secretKey, publicKey: organizerCulqi.publicKey },
    );

    await this.attachOrderToPayment(payment.id, input.user.id, order.id);

    return {
      status: 200,
      body: {
        success: true,
        orderId: order.id,
        enableYape,
      },
    };
  }
}
