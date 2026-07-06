import { NextResponse } from "next/server";
import { env } from "@/env";
import { verifyCronAuth } from "@/lib/cron/verify-cron-auth";
import {
  markPastPublishedEventsCompleted,
  cleanupOrphanGuestUsers,
} from "@/lib/events/lifecycle";

export async function GET(req: Request) {
  const authFailure = verifyCronAuth(req, env.CRON_SECRET);
  if (authFailure) return authFailure.response;

  try {
    const completed = await markPastPublishedEventsCompleted();
    const orphans = await cleanupOrphanGuestUsers();
    return NextResponse.json({ success: true, completed, orphans });
  } catch (error) {
    console.error("[cron/events]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al procesar eventos" },
      { status: 500 },
    );
  }
}
