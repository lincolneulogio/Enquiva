import { NextResponse } from "next/server";
import { requireApiSession, apiAuthErrorResponse } from "@/lib/auth/api-guards";
import { db } from "@/lib/db";
import { payments, registrations, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createCulqiOrder, CULQI_ORDER_MIN_AMOUNT_PEN } from "@/lib/culqi/client";
import { getUserCulqiProfile } from "@/lib/culqi/customer-data.server";
import { mergeSessionCulqiProfile } from "@/lib/culqi/customer-data";
import { getCulqiCredentialsForEvent } from "@/lib/culqi/capabilities";
import { requirePlanFeature, getOrganizerPlanForEvent } from "@/lib/billing/enforce";
import { CulqiEventPaymentService } from "@/lib/culqi/event-payment.service";

export async function POST(req: Request) {
  try {
    const { user } = await requireApiSession();

    const body = await req.json();
    const paymentId = String(body.paymentId ?? "");

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId es requerido" }, { status: 400 });
    }

    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (!payment || payment.userId !== user.id) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    if (payment.status === "approved") {
      return NextResponse.json({ success: true, idempotent: true, orderId: payment.gatewayOrderId });
    }

    if (payment.gatewayOrderId) {
      return NextResponse.json({
        success: true,
        orderId: payment.gatewayOrderId,
        enableYape: Number(payment.amount) >= CULQI_ORDER_MIN_AMOUNT_PEN,
      });
    }

    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, payment.registrationId))
      .limit(1);

    if (!registration) {
      return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 });
    }

    const organizerCulqi = await getCulqiCredentialsForEvent(registration.eventId);
    if (!organizerCulqi) {
      return NextResponse.json(
        { error: "El organizador no tiene Culqi configurado para este evento" },
        { status: 503 },
      );
    }

    const [event] = await db.select().from(events).where(eq(events.id, registration.eventId)).limit(1);
    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    }

    const organizerPlan = await getOrganizerPlanForEvent(event.id);
    if (organizerPlan) {
      await requirePlanFeature(event.organizerId, "organizer", "culqi");
    }

    const amount = Number(payment.amount);
    const enableYape = amount >= CULQI_ORDER_MIN_AMOUNT_PEN;

    const dbProfile = await getUserCulqiProfile(user.id);
    const customer = mergeSessionCulqiProfile(user, dbProfile);

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

    await CulqiEventPaymentService.attachOrderToPayment(payment.id, user.id, order.id);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      enableYape,
    });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("[Culqi order]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear orden Culqi" },
      { status: 500 },
    );
  }
}
