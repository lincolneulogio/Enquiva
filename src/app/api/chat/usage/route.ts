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
    return NextResponse.json(usage);
  } catch (error: unknown) {
    const authResponse = apiAuthErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : "Error al consultar uso de IA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
