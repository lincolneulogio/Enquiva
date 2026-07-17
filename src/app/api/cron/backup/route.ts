import { NextResponse } from "next/server";
import { env } from "@/env";
import { verifyCronAuth } from "@/lib/cron/verify-cron-auth";
import { logger } from "@/lib/observability/structured-logger";
import { randomUUID } from "node:crypto";

export async function GET(req: Request) {
  const requestId = req.headers.get("x-request-id") ?? randomUUID();
  const authFailure = verifyCronAuth(req, env.CRON_SECRET);
  if (authFailure) return authFailure.response;

  logger.warn("cron.backup.not_configured", { requestId });
  return NextResponse.json(
    {
      success: false,
      backupCreated: false,
      mode: "diagnostic",
      requestId,
      error:
        "No hay un destino de backup persistente configurado. Este endpoint no exporta ni carga datos o secretos en memoria.",
      action:
        "Configura backups administrados en el proveedor de PostgreSQL o ejecuta pnpm run db:backup en un host con almacenamiento persistente.",
    },
    { status: 501 },
  );
}
