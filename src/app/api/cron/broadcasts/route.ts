import { NextResponse } from "next/server";
import { env } from "@/env";
import { verifyCronAuth } from "@/lib/cron/verify-cron-auth";
import { processPendingBroadcastJobs } from "@/lib/notifications/broadcast-queue";

export async function GET(req: Request) {
  const authFailure = verifyCronAuth(req, env.CRON_SECRET);
  if (authFailure) return authFailure.response;

  try {
    const processed = await processPendingBroadcastJobs(5);
    return NextResponse.json({ success: true, processed });
  } catch (error) {
    console.error("[cron/broadcasts]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al procesar broadcasts" },
      { status: 500 },
    );
  }
}
