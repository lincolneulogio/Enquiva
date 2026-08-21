import { NextResponse } from "next/server";
import { requireApiSession, apiAuthErrorResponse } from "@/lib/auth/api-guards";
import { CulqiEventPaymentService } from "@/lib/culqi/event-payment.service";
import { logCulqiFailure } from "@/lib/culqi/observability";
import { culqiOrderBodySchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const { user } = await requireApiSession();
    const parsed = culqiOrderBodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "paymentId es requerido" }, { status: 400 });
    }

    const result = await CulqiEventPaymentService.processOrder({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      paymentId: parsed.data.paymentId,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    logCulqiFailure("event", "order.create", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear orden Culqi" },
      { status: 500 },
    );
  }
}
