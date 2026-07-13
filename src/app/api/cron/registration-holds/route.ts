import { NextResponse } from "next/server";
import { env } from "@/env";
import { verifyCronAuth } from "@/lib/cron/verify-cron-auth";
import { processRegistrationHolds } from "@/lib/registrations/expire-holds";

export async function GET(req: Request) {
  const authFailure = verifyCronAuth(req, env.CRON_SECRET);
  if (authFailure) return authFailure.response;

  try {
    const result = await processRegistrationHolds();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[cron/registration-holds]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al procesar holds" },
      { status: 500 },
    );
  }
}
