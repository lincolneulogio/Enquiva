import { NextResponse } from "next/server";
import { env } from "@/env";
import { verifyCronAuth } from "@/lib/cron/verify-cron-auth";
import { runDailyFinanceDigest } from "@/lib/notifications/daily-finance-digest";

export async function GET(req: Request) {
  const authFailure = verifyCronAuth(req, env.CRON_SECRET);
  if (authFailure) return authFailure.response;

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";

  try {
    const result = await runDailyFinanceDigest({ force });
    console.info("[cron/finance-digest]", result);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[cron/finance-digest]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al generar resumen financiero" },
      { status: 500 },
    );
  }
}
