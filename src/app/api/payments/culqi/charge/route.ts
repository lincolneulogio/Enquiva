import { NextResponse } from "next/server";
import { requireApiSession, apiAuthErrorResponse } from "@/lib/auth/api-guards";
import { CulqiEventPaymentService } from "@/lib/culqi/event-payment.service";
import { logCulqiFailure } from "@/lib/culqi/observability";
import { culqiChargeBodySchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const { user } = await requireApiSession();
    const parsed = culqiChargeBodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "paymentId y sourceId son requeridos" },
        { status: 400 },
      );
    }

    const result = await CulqiEventPaymentService.processCharge({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      paymentId: parsed.data.paymentId,
      sourceId: parsed.data.sourceId,
    });

    return NextResponse.json(result.body, { status: result.status });
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
