import { NextResponse } from "next/server";
import { env } from "@/env";
import { processCulqiWebhook } from "@/lib/culqi/webhook-handler";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-culqi-signature");
    if (env.CULQI_WEBHOOK_SECRET && signature !== env.CULQI_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    const payload = await req.json();
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
