import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createCulqiCharge, isCulqiConfigured } from "@/lib/culqi/client";
import { SubscriptionPaymentService } from "@/lib/billing/subscription-payment.service";
import { SubscriptionService } from "@/lib/billing/subscription.service";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!["organizer", "admin", "super_admin"].includes(session.user.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isCulqiConfigured()) {
      return NextResponse.json({ error: "Culqi no está configurado" }, { status: 503 });
    }

    const body = await req.json();
    const planId = String(body.planId ?? "");
    const sourceId = String(body.sourceId ?? "");

    if (!planId || !sourceId) {
      return NextResponse.json({ error: "planId y sourceId son requeridos" }, { status: 400 });
    }

    const pending = await SubscriptionPaymentService.getPendingForUser(session.user.id);
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

    const charge = await createCulqiCharge({
      amount,
      email: session.user.email,
      sourceId,
      description: `Suscripción ${plan.name} - EncuentroDeFe`,
      metadata: {
        userId: session.user.id,
        planId: plan.id,
        type: "subscription",
      },
    });

    if (charge.outcome?.type !== "venta_exitosa") {
      return NextResponse.json({ error: "Pago rechazado por Culqi" }, { status: 402 });
    }

    const payment = await SubscriptionPaymentService.createCulqiPaymentRecord({
      userId: session.user.id,
      planId: plan.id,
      amount,
      chargeId: charge.id,
    });

    await SubscriptionService.assignPlanToUser(session.user.id, plan.id, "super_admin");

    const { subscriptions } = await import("@/lib/db/schema");
    const [sub] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .limit(1);

    await SubscriptionService.recordPlatformTransaction({
      type: "subscription",
      amount,
      userId: session.user.id,
      subscriptionId: sub?.id,
      description: `Suscripción plan ${plan.name} (Culqi)`,
      metadata: { chargeId: charge.id, subscriptionPaymentId: payment.id },
    });

    return NextResponse.json({ success: true, chargeId: charge.id });
  } catch (error) {
    console.error("[Billing Culqi charge]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al procesar pago" },
      { status: 500 },
    );
  }
}
