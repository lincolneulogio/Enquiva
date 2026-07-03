import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { payments, registrations, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createCulqiCharge, isCulqiConfigured } from "@/lib/culqi/client";
import { requirePlanFeature, getOrganizerPlanForEvent, getPlatformFee } from "@/lib/billing/enforce";
import { PaymentService } from "@/services/payments/payment.service";
import { SubscriptionService } from "@/lib/billing/subscription.service";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!isCulqiConfigured()) {
      return NextResponse.json({ error: "Culqi no está configurado en el servidor" }, { status: 503 });
    }

    const body = await req.json();
    const paymentId = String(body.paymentId ?? "");
    const sourceId = String(body.sourceId ?? "");

    if (!paymentId || !sourceId) {
      return NextResponse.json({ error: "paymentId y sourceId son requeridos" }, { status: 400 });
    }

    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (!payment || payment.userId !== session.user.id) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    const [registration] = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, payment.registrationId))
      .limit(1);

    if (!registration) {
      return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 });
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
    const platformFee = organizerPlan ? getPlatformFee(amount, organizerPlan) : 0;

    const charge = await createCulqiCharge({
      amount,
      email: session.user.email,
      sourceId,
      description: `Entrada: ${event.title}`,
      metadata: {
        paymentId: payment.id,
        registrationId: registration.id,
        eventId: event.id,
      },
    });

    if (charge.outcome?.type !== "venta_exitosa") {
      return NextResponse.json({ error: "Pago rechazado por Culqi" }, { status: 402 });
    }

    await db
      .update(payments)
      .set({
        method: "culqi",
        gatewayProvider: "culqi",
        gatewayChargeId: charge.id,
        gatewayStatus: charge.outcome.type,
        platformFee: platformFee > 0 ? String(platformFee) : null,
        reference: charge.id,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    if (platformFee > 0) {
      await SubscriptionService.recordPlatformTransaction({
        type: "commission",
        amount: platformFee,
        userId: event.organizerId,
        paymentId: payment.id,
        description: `Comisión plataforma evento ${event.title}`,
        metadata: { chargeId: charge.id },
      });
    }

    await PaymentService.updatePaymentStatus(event.organizerId, "organizer", {
      paymentId: payment.id,
      status: "approved",
      notes: "Aprobado automáticamente vía Culqi",
    });

    return NextResponse.json({ success: true, chargeId: charge.id });
  } catch (error) {
    console.error("[Culqi charge]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al procesar pago" },
      { status: 500 },
    );
  }
}
