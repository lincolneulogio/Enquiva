import { requireApiSession, apiAuthErrorResponse } from "@/lib/auth/api-guards";
import { NextResponse } from "next/server";
import { getAiChatUsage } from "@/lib/billing/ai-chat-usage";
import { requirePlanFeature } from "@/lib/billing/enforce";
import { normalizeRole } from "@/lib/auth/rbac";

export async function GET() {
  try {
    const { user } = await requireApiSession();

    const userRole = normalizeRole(user.role ?? "member");
    await requirePlanFeature(user.id, userRole, "ai");

    const usage = await getAiChatUsage(user.id, userRole);
    const percentUsed =
      usage.limit != null && usage.limit > 0
        ? Math.min(100, Math.round((usage.used / usage.limit) * 100))
        : null;
    return NextResponse.json({
      ...usage,
      percentUsed,
      nearLimit: percentUsed != null && percentUsed >= 80,
      unlimited: usage.limit == null,
    });
  } catch (error: unknown) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : "Error al consultar uso de IA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
