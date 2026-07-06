import { NextResponse } from "next/server";
import { env } from "@/env";
import { verifyCronAuth } from "@/lib/cron/verify-cron-auth";
import { exportFullDatabaseData, summarizeExport } from "@/lib/db/export-full-database";

export async function GET(req: Request) {
  const authFailure = verifyCronAuth(req, env.CRON_SECRET);
  if (authFailure) return authFailure.response;

  try {
    const exportData = await exportFullDatabaseData();
    const summary = summarizeExport(exportData);

    console.info("[cron/backup]", {
      timestamp: exportData.timestamp,
      version: exportData.version,
      ...summary,
    });

    return NextResponse.json({
      success: true,
      timestamp: exportData.timestamp,
      version: exportData.version,
      ...summary,
      note: "Usa backups del proveedor (Neon/Supabase) como respaldo principal. Ejecuta pnpm run db:backup para export JSON completo.",
    });
  } catch (error) {
    console.error("[cron/backup]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al verificar backup" },
      { status: 500 },
    );
  }
}
