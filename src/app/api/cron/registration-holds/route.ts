import { NextResponse } from "next/server";
import { env } from "@/env";
import { verifyCronAuth } from "@/lib/cron/verify-cron-auth";
import { processRegistrationHolds } from "@/lib/registrations/expire-holds";
import { expirePendingTransportBookings } from "@/lib/transport/expire-pending";

export async function GET(req: Request) {
  const authFailure = verifyCronAuth(req, env.CRON_SECRET);
  if (authFailure) return authFailure.response;

  try {
    const [holds, transport] = await Promise.all([
      processRegistrationHolds(),
      expirePendingTransportBookings(),
    ]);
    return NextResponse.json({
      success: true,
      ...holds,
      transportExpired: transport.expired,
    });
  } catch (error) {
    console.error("[cron/registration-holds]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al procesar holds" },
      { status: 500 },
    );
  }
}
