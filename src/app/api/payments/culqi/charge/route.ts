import { NextResponse } from "next/server";
import { requireApiSession, apiAuthErrorResponse } from "@/lib/auth/api-guards";
import { db } from "@/lib/db";
import { payments, registrations, events } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { createCulqiCharge, getCulqiCharge } from "@/lib/culqi/client";
import { getUserCulqiProfile } from "@/lib/culqi/customer-data.server";
import { mergeSessionCulqiProfile } from "@/lib/culqi/customer-data";
import { getCulqiCredentialsForEvent } from "@/lib/culqi/capabilities";
import { requirePlanFeature, getOrganizerPlanForEvent } from "@/lib/billing/enforce";
import { computeEventCommissionFee } from "@/lib/billing/platform-commission";
import type { ResolvedPlan } from "@/lib/billing/types";
import { CulqiEventPaymentService } from "@/lib/culqi/event-payment.service";
import { logCulqi, logCulqiFailure } from "@/lib/culqi/observability";
import { assertPaymentCanBeApproved } from "@/lib/payments/payment-integrity";

async function resolvePlatformFeeForPayment(
  registrationId: string,
  amount: number,
  organizerPlan: ResolvedPlan | null,
) {
  if (!organizerPlan) return 0;
  const [guests] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(registrations)
    .where(eq(registrations.parentRegistrationId, registrationId));
  const inscriptionCount = 1 + Number(guests?.total ?? 0);
  return computeEventCommissionFee(amount, organizerPlan, inscriptionCount);
}

export async function POST(req: Request) {
  try {
    const { user } = await requireApiSession();

    const body = await req.json();
    const paymentId = String(body.paymentId ?? "");
    const sourceId = String(body.sourceId ?? "");

    if (!paymentId || !sourceId) {
      return NextResponse.json({ error: "paymentId y sourceId son requeridos" }, { status: 400 });
    }

    const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (!payment || payment.userId !== user.id) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    if (payment.status === "approved") {
      return NextResponse.json({
        success: true,
        chargeId: payment.gatewayChargeId,
        idempotent: true,
      });
    }

    if (payment.status !== "pending" && payment.status !== "rejected") {
      return NextResponse.json({ error: "Este pago no puede procesarse" }, { status: 409 });
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
          const result = await CulqiEventPaymentService.fulfillApprovedCharge({
            paymentId: payment.id,
            chargeId: existingCharge.id,
            gatewayStatus: existingCharge.outcome.type,
            platformFee,
            notes: "Aprobado automáticamente vía Culqi (reconciliación)",
          });
          return NextResponse.json({
            success: true,
            chargeId: existingCharge.id,
            idempotent: result.idempotent ?? true,
          });
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

    const dbProfile = await getUserCulqiProfile(user.id);
    const customer = mergeSessionCulqiProfile(user, dbProfile);
    const claimed = await CulqiEventPaymentService.claimGatewayOperation(
      payment.id,
      user.id,
      "charge",
    );
    if (!claimed) {
      return NextResponse.json(
        { error: "Ya hay una operación Culqi en proceso para este pago" },
        { status: 409 },
      );
    }

    const charge = await createCulqiCharge(
      {
        amount,
        email: customer.email,
        sourceId,
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
      await CulqiEventPaymentService.reconcileChargeFailure(charge);
      return NextResponse.json({ error: "Pago rechazado por Culqi" }, { status: 402 });
    }

    const result = await CulqiEventPaymentService.fulfillApprovedCharge({
      paymentId: payment.id,
      chargeId: charge.id,
      gatewayStatus: charge.outcome.type,
      platformFee,
      notes: "Aprobado automáticamente vía Culqi",
    });

    return NextResponse.json({
      success: true,
      chargeId: charge.id,
      idempotent: result.idempotent ?? false,
    });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    logCulqiFailure("event", "charge.create", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al procesar pago" },
      { status: 500 },
    );
  }
}
