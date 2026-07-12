import { NextResponse } from "next/server";
import { env } from "@/env";
import { isPlatformCulqiConfigured } from "@/lib/culqi/client";
import { processCulqiWebhook } from "@/lib/culqi/webhook-handler";
import { verifyCulqiWebhookAuth } from "@/lib/culqi/webhook-auth";
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

    const rawBody = await req.text();
    const url = new URL(req.url);
    const queryToken = url.searchParams.get("token");
    const signatureHeader =
      req.headers.get("x-culqi-signature") ?? req.headers.get("x-signature");

    if (webhookSecret) {
      const auth = verifyCulqiWebhookAuth({
        rawBody,
        signatureHeader,
        queryToken,
        secret: webhookSecret,
      });

      if (!auth.ok) {
        logCulqi("warn", {
          scope: "webhook",
          action: "auth.invalid_signature",
          ok: false,
          status: 401,
          meta: { reason: auth.reason },
        });
        return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
      }

      if (auth.mode === "legacy-header") {
        logCulqi("warn", {
          scope: "webhook",
          action: "auth.legacy_header",
          ok: true,
          message:
            "Webhook autenticado con secret estático en header; preferir HMAC del body o ?token=",
        });
      }
    } else if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Firma requerida" }, { status: 401 });
    }

    let payload: unknown;
    try {
      payload = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

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
    logCulqiFailure("webhook", "unhandled", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
