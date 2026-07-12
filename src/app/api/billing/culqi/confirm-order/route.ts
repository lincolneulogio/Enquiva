import { NextResponse } from "next/server";
import { requireApiRole, apiAuthErrorResponse } from "@/lib/auth/api-guards";
import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  getCulqiOrder,
  getPlatformCulqiCredentials,
  isPlatformCulqiConfigured,
} from "@/lib/culqi/client";
import { SubscriptionPaymentService } from "@/lib/billing/subscription-payment.service";
import {
  resolveSubscriptionBillingContext,
  canManageSubscriptionBilling,
  getBillingUserId,
} from "@/lib/billing/subscription-context";
import { logCulqi, logCulqiFailure } from "@/lib/culqi/observability";

/**
 * Confirma una orden Culqi pagada (Yape / billeteras) y activa el plan.
 */
export async function POST(req: Request) {
  try {
    const { user } = await requireApiRole(["organizer", "admin", "super_admin"]);

    const billingCtx = await resolveSubscriptionBillingContext(user.id, user.role);
    if (!canManageSubscriptionBilling(user.id, user.role, billingCtx)) {
      return NextResponse.json(
        { error: "El plan de tu entidad lo gestiona el administrador." },
        { status: 403 },
      );
    }

    const billingUserId = getBillingUserId(billingCtx);
    if (!billingUserId) {
      return NextResponse.json({ error: "Contexto de facturación inválido" }, { status: 400 });
    }

    if (!isPlatformCulqiConfigured()) {
      return NextResponse.json({ error: "Culqi no está configurado" }, { status: 503 });
    }

    const platformCulqi = getPlatformCulqiCredentials();
    if (!platformCulqi) {
      return NextResponse.json({ error: "Culqi no está configurado" }, { status: 503 });
    }

    const body = await req.json();
    const planId = String(body.planId ?? "");
    const orderId = String(body.orderId ?? "");

    if (!planId || !orderId) {
      return NextResponse.json({ error: "planId y orderId son requeridos" }, { status: 400 });
    }

    const order = await getCulqiOrder(orderId, platformCulqi);
    if (order.state !== "paid") {
      return NextResponse.json(
        { error: "La orden aún no está pagada. Completa el pago en Culqi." },
        { status: 402 },
      );
    }

    if (order.metadata?.type === "subscription") {
      if (order.metadata.userId && order.metadata.userId !== billingUserId) {
        return NextResponse.json({ error: "Orden no pertenece a tu cuenta" }, { status: 403 });
      }
      if (order.metadata.planId && order.metadata.planId !== planId) {
        return NextResponse.json({ error: "La orden no coincide con el plan" }, { status: 400 });
      }
    }

    const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    const amount = Number(plan.priceMonthly);
    const expectedCents = Math.round(amount * 100);
    if (typeof order.amount === "number" && order.amount !== expectedCents) {
      logCulqi("error", {
        scope: "billing",
        action: "confirm_order.amount_mismatch",
        ok: false,
        status: 400,
        meta: { planId, orderId, expectedCents, gotCents: order.amount },
      });
      return NextResponse.json(
        {
          error: `El monto pagado (S/ ${(order.amount / 100).toFixed(2)}) no coincide con el plan ${plan.name} (S/ ${amount.toFixed(2)}).`,
        },
        { status: 400 },
      );
    }

    const result = await SubscriptionPaymentService.fulfillCulqiSubscriptionCharge({
      userId: billingUserId,
      planId: plan.id,
      planName: plan.name,
      amount,
      chargeId: orderId,
      method: "yape",
    });

    logCulqi("info", {
      scope: "billing",
      action: "confirm_order.fulfilled",
      ok: true,
      meta: { planId, orderId, idempotent: result.idempotent },
    });

    return NextResponse.json({
      success: true,
      orderId,
      idempotent: result.idempotent,
      subscriptionId: result.subscriptionId,
    });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    logCulqiFailure("billing", "confirm_order", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al confirmar orden" },
      { status: 500 },
    );
  }
}
