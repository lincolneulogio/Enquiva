import { NextResponse } from "next/server";
import { env } from "@/env";
import { isPlatformCulqiConfigured } from "@/lib/culqi/client";
import { processCulqiWebhook } from "@/lib/culqi/webhook-handler";
import { logCulqi, logCulqiFailure } from "@/lib/culqi/observability";

export async function POST(req: Request) {
  try {
    const culqiEnabled = isPlatformCulqiConfigured();
    const webhookSecret = env.CULQI_WEBHOOK_SECRET;

    if (process.env.NODE_ENV === "production" && culqiEnabled && !webhookSecret) {
      logCulqi("error", {
        scope: "webhook",
        action: "config.missing_secret",
        ok: false,
        status: 503,
        message: "CULQI_WEBHOOK_SECRET is required in production",
      });
      return NextResponse.json({ error: "Webhook no configurado" }, { status: 503 });
    }

    if (webhookSecret) {
      const signature = req.headers.get("x-culqi-signature");
      if (!signature || signature !== webhookSecret) {
        logCulqi("warn", {
          scope: "webhook",
          action: "auth.invalid_signature",
          ok: false,
          status: 401,
        });
        return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Firma requerida" }, { status: 401 });
    }

    const payload: unknown = await req.json();
    const result = await processCulqiWebhook(payload);

    if (!result.ok) {
      logCulqi("error", {
        scope: "webhook",
        action: "process.failed",
        ok: false,
        status: 500,
        meta: { result },
      });
      return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }

    logCulqi("info", {
      scope: "webhook",
      action: "process.ok",
      ok: true,
      meta: { result },
    });

    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    logCulqiFailure("webhook", "process", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
