import { NextResponse } from "next/server";
import { env } from "@/env";
import { isPlatformCulqiConfigured } from "@/lib/culqi/client";
import { processCulqiWebhook } from "@/lib/culqi/webhook-handler";

export async function POST(req: Request) {
  try {
    const culqiEnabled = isPlatformCulqiConfigured();
    const webhookSecret = env.CULQI_WEBHOOK_SECRET;

    if (process.env.NODE_ENV === "production" && culqiEnabled && !webhookSecret) {
      console.error("[Culqi webhook] CULQI_WEBHOOK_SECRET is required in production");
      return NextResponse.json({ error: "Webhook no configurado" }, { status: 503 });
    }

    if (webhookSecret) {
      const signature = req.headers.get("x-culqi-signature");
      if (!signature || signature !== webhookSecret) {
        return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === "production") {
      // Culqi disabled or secret missing already handled above; reject unsigned in prod.
      return NextResponse.json({ error: "Firma requerida" }, { status: 401 });
    }

    const payload: unknown = await req.json();
    const result = await processCulqiWebhook(payload);

    if (!result.ok) {
      return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }

    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    console.error("[Culqi webhook]", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
