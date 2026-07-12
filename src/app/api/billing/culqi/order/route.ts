import { NextResponse } from "next/server";
import { requireApiRole, apiAuthErrorResponse } from "@/lib/auth/api-guards";
import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createCulqiOrder,
  getPlatformCulqiCredentials,
  isPlatformCulqiConfigured,
  CULQI_ORDER_MIN_AMOUNT_PEN,
} from "@/lib/culqi/client";
import { getUserCulqiProfile } from "@/lib/culqi/customer-data.server";
import { mergeSessionCulqiProfile, formatCulqiPhone } from "@/lib/culqi/customer-data";
import { SubscriptionPaymentService } from "@/lib/billing/subscription-payment.service";
import {
  resolveSubscriptionBillingContext,
  canManageSubscriptionBilling,
  getBillingUserId,
} from "@/lib/billing/subscription-context";

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
    if (!planId) {
      return NextResponse.json({ error: "planId es requerido" }, { status: 400 });
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

    const enableYape = amount >= CULQI_ORDER_MIN_AMOUNT_PEN;
    if (!enableYape) {
      return NextResponse.json({
        success: true,
        orderId: null,
        enableYape: false,
      });
    }

    const dbProfile = await getUserCulqiProfile(user.id);
    const customer = mergeSessionCulqiProfile(user, dbProfile);
    const localPhone = formatCulqiPhone(customer.phone);
    if (!/^9\d{8}$/.test(localPhone)) {
      return NextResponse.json(
        { error: "Completa tu teléfono en Perfil antes de pagar (Yape / billeteras)." },
        { status: 400 },
      );
    }

    const orderNumber = `sub${billingUserId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}${Date.now()}`
      .slice(0, 36);

    const order = await createCulqiOrder(
      {
        amount,
        email: customer.email,
        customer,
        description: `Suscripción ${plan.name} - Evora`,
        orderNumber,
        metadata: {
          userId: billingUserId,
          planId: plan.id,
          type: "subscription",
        },
      },
      platformCulqi,
    );

    return NextResponse.json({
      success: true,
      orderId: order.id,
      enableYape: true,
    });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[Billing Culqi order]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear orden Culqi" },
      { status: 500 },
    );
  }
}
