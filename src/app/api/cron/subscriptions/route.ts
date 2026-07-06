import { NextResponse } from "next/server";
import { env } from "@/env";
import { verifyCronAuth } from "@/lib/cron/verify-cron-auth";
import { SubscriptionService } from "@/lib/billing/subscription.service";

export async function GET(req: Request) {
  const authFailure = verifyCronAuth(req, env.CRON_SECRET);
  if (authFailure) return authFailure.response;

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
