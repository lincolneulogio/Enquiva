import { NextResponse } from "next/server";
import { env } from "@/env";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-culqi-signature");
    if (env.CULQI_WEBHOOK_SECRET && signature !== env.CULQI_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    const payload = await req.json();
    console.log("[Culqi webhook]", payload?.type ?? "unknown");

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Culqi webhook]", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
