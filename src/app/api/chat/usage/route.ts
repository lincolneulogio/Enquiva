import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getAiChatUsage } from "@/lib/billing/ai-chat-usage";
import { requirePlanFeature } from "@/lib/billing/enforce";
import { normalizeRole } from "@/lib/auth/rbac";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = normalizeRole(session.user.role ?? "member");
    await requirePlanFeature(session.user.id, userRole, "ai");

    const usage = await getAiChatUsage(session.user.id, userRole);
    return NextResponse.json(usage);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al consultar uso de IA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
