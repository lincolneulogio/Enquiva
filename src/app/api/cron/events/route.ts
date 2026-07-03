import { NextResponse } from "next/server";
import { env } from "@/env";
import {
  markPastPublishedEventsCompleted,
  cleanupOrphanGuestUsers,
} from "@/lib/events/lifecycle";

export async function GET(req: Request) {
  const secret = env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 503 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

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
