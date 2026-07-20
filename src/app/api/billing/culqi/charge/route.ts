import { NextResponse } from "next/server";
import { requireApiRole, apiAuthErrorResponse } from "@/lib/auth/api-guards";
import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createCulqiCharge, getPlatformCulqiCredentials, isPlatformCulqiConfigured } from "@/lib/culqi/client";
import { getUserCulqiProfile } from "@/lib/culqi/customer-data.server";
import { mergeSessionCulqiProfile, formatCulqiPhone } from "@/lib/culqi/customer-data";
import { SubscriptionPaymentService } from "@/lib/billing/subscription-payment.service";
import { SubscriptionAutoRenewService } from "@/lib/billing/subscription-auto-renew.service";
import {
  resolveSubscriptionBillingContext,
  canManageSubscriptionBilling,
  getBillingUserId,
} from "@/lib/billing/subscription-context";
import { SubscriptionService } from "@/lib/billing/subscription.service";
import { logCulqiFailure } from "@/lib/culqi/observability";

export async function POST(req: Request) {
  try {
    const { user } = await requireApiRole(["organizer", "admin", "super_admin"]);

    const billingCtx = await resolveSubscriptionBillingContext(
      user.id,
      user.role,
    );
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

    const body = await req.json();
    const planId = String(body.planId ?? "");
    const sourceId = String(body.sourceId ?? "");
    const enableAutoRenew = Boolean(body.enableAutoRenew);

    if (!planId || !sourceId) {
      return NextResponse.json({ error: "planId y sourceId son requeridos" }, { status: 400 });
    }

    if (!user.email) {
      return NextResponse.json({ error: "Tu cuenta necesita un email para pagar" }, { status: 400 });
    }

    const pending = await SubscriptionPaymentService.getPendingForUser(billingUserId);
    if (pending) {
      return NextResponse.json(
        { error: "Tienes un pago de plan pendiente de revisión" },
        { status: 409 },
      );
    }

    const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
    }

    const amount = Number(plan.priceMonthly);
    if (amount <= 0) {
      return NextResponse.json({ error: "Este plan es gratuito" }, { status: 400 });
    }

    const dbProfile = await getUserCulqiProfile(user.id);
    const customer = mergeSessionCulqiProfile(user, dbProfile);

    const localPhone = formatCulqiPhone(customer.phone);
    if (!/^9\d{8}$/.test(localPhone)) {
      return NextResponse.json(
        { error: "Completa tu teléfono en Perfil antes de pagar con tarjeta." },
        { status: 400 },
      );
    }

    const platformCulqi = getPlatformCulqiCredentials();
    if (!platformCulqi) {
      return NextResponse.json({ error: "Culqi no está configurado" }, { status: 503 });
    }
    let chargeSourceId = sourceId;
    let useRecurrent = false;

    if (enableAutoRenew) {
      await SubscriptionAutoRenewService.prepareAutoRenewCard(
        billingUserId,
        customer,
        sourceId,
        user.role,
      );
      const sub = await SubscriptionService.findSubscriptionForBillingUser(
        billingUserId,
        user.role,
      );

      if (!sub?.culqiCardId) {
        return NextResponse.json(
          { error: "No se pudo guardar la tarjeta para renovación automática" },
          { status: 400 },
        );
      }
      chargeSourceId = sub.culqiCardId;
      useRecurrent = true;
    }

    const charge = await createCulqiCharge(
      {
        amount,
        email: customer.email,
        sourceId: chargeSourceId,
        recurrent: useRecurrent,
        customer,
        description: `Suscripción ${plan.name} - Enquiva`,
        metadata: {
          userId: billingUserId,
          planId: plan.id,
          type: "subscription",
        },
      },
      platformCulqi,
    );

    if (charge.outcome?.type !== "venta_exitosa") {
      return NextResponse.json({ error: "Pago rechazado por Culqi" }, { status: 402 });
    }

    const result = await SubscriptionPaymentService.fulfillCulqiSubscriptionCharge({
      userId: billingUserId,
      planId: plan.id,
      planName: plan.name,
      amount,
      chargeId: charge.id,
    });

    return NextResponse.json({
      success: true,
      chargeId: charge.id,
      idempotent: result.idempotent,
      subscriptionId: result.subscriptionId,
    });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    logCulqiFailure("billing", "charge.create", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al procesar pago" },
      { status: 500 },
    );
  }
}
