import { NextResponse } from "next/server";
import { env } from "@/env";
import { verifyCronAuth } from "@/lib/cron/verify-cron-auth";
import { processPendingBroadcastJobs } from "@/lib/notifications/broadcast-queue";
import { logger } from "@/lib/observability/structured-logger";
import { randomUUID } from "node:crypto";

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") ?? randomUUID();
  const authFailure = verifyCronAuth(req, env.CRON_SECRET);
  if (authFailure) return authFailure.response;

  try {
    const result = await processPendingBroadcastJobs(100);
    logger.info("cron.broadcasts.completed", { requestId, ...result });
    return NextResponse.json({ success: true, requestId, ...result });
  } catch (error) {
    logger.error("cron.broadcasts.failed", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      {
        requestId,
        error: error instanceof Error ? error.message : "Error al procesar broadcasts",
      },
      { status: 500 },
    );
  }
}
