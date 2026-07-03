import { NextResponse } from "next/server";
import { env } from "@/env";
import { SubscriptionService } from "@/lib/billing/subscription.service";

export async function GET(req: Request) {
  const secret = env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 503 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await SubscriptionService.processSubscriptionLifecycle();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[cron/subscriptions]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al procesar suscripciones" },
      { status: 500 },
    );
  }
}
