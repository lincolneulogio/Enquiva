import { db } from "@/lib/db";
import { payments, registrations, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createCulqiRefund } from "@/lib/culqi/client";
import { getCulqiCredentialsForEvent } from "@/lib/culqi/capabilities";
import { CulqiEventPaymentService } from "@/lib/culqi/event-payment.service";
import { assertCanManageEvent } from "@/lib/organizations/admin-scope";
import { invalidateAdminDashboardStatsCache } from "@/lib/analytics/admin";

export class CulqiRefundService {
  /**
   * Inicia reembolso Culqi de un pago aprobado con charge_id.
   * El webhook (o reconcile local) actualiza el estado final.
   */
  static async initiateRefund(input: {
    actorId: string;
    actorRole: string;
    paymentId: string;
    amount?: number;
    reason?: string;
  }) {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, input.paymentId))
      .limit(1);

    if (!payment) throw new Error("Pago no encontrado");
    if (payment.status !== "approved") {
      throw new Error("Solo se pueden reembolsar pagos aprobados");
    }
    if (!payment.gatewayChargeId) {
      throw new Error("Este pago no tiene cargo Culqi; marca el estado manualmente o contacta soporte");
    }
    if (payment.gatewayStatus === "refund_pending" || payment.gatewayStatus === "refunded") {
      throw new Error("Este pago ya tiene un reembolso en proceso o completado");
    }

    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, payment.registrationId))
      .limit(1);
    if (!registration) throw new Error("Inscripción no encontrada");

    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, registration.eventId))
      .limit(1);
    if (!event) throw new Error("Evento no encontrado");

    await assertCanManageEvent(
      {
        id: event.id,
        organizerId: event.organizerId,
        organizationId: event.organizationId,
      },
      input.actorId,
      input.actorRole,
    );

    const credentials = await getCulqiCredentialsForEvent(event.id);
    if (!credentials?.secretKey) {
      throw new Error("Culqi no está configurado para este evento");
    }

    const refundAmount =
      input.amount != null ? input.amount : Number(payment.amount);
    if (
      !Number.isFinite(refundAmount) ||
      Math.round(refundAmount * 100) !== Math.round(Number(payment.amount) * 100)
    ) {
      throw new Error("Solo se admite el reembolso total mientras no exista contabilidad parcial");
    }

    const refund = await createCulqiRefund(
      {
        chargeId: payment.gatewayChargeId,
        amount: refundAmount,
        reason: input.reason ?? "solicitud_comprador",
      },
      credentials,
    );

    await db
      .update(payments)
      .set({
        gatewayStatus: "refund_pending",
        notes: [payment.notes, `Reembolso Culqi iniciado: ${refund.id}`]
          .filter(Boolean)
          .join(" · "),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    // Conciliación inmediata si Culqi ya devolvió éxito síncrono
    await CulqiEventPaymentService.reconcileRefund(payment.gatewayChargeId);
    await invalidateAdminDashboardStatsCache();

    return { success: true as const, refundId: refund.id, paymentId: payment.id };
  }
}
